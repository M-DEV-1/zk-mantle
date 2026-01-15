// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./VerifierAge.sol";

/**
 * @title ZKGPSVerifier
 * @notice Main verification registry that stores proof verification results on-chain
 * @dev Wraps Groth16 verifiers and emits events for MantleScan visibility
 */
contract ZKGPSVerifier {
    // Verifier contracts
    Groth16Verifier public ageVerifier;
    // Note: Location verifier has same interface, just different constants

    // Verification types
    enum VerificationType {
        Age,
        Location
    }

    // Verification record
    struct VerificationRecord {
        address user;
        address provider;
        VerificationType verificationType;
        bool verified;
        uint256 timestamp;
        bytes32 requestHash;
    }

    // Storage
    mapping(bytes32 => VerificationRecord) public verifications;
    mapping(address => bytes32[]) public userVerifications;
    mapping(address => bytes32[]) public providerVerifications;

    uint256 public totalVerifications;
    uint256 public successfulVerifications;

    // Events - THESE SHOW UP ON MANTLESCAN
    event ProofVerified(
        bytes32 indexed verificationId,
        address indexed user,
        address indexed provider,
        VerificationType verificationType,
        bool verified,
        uint256 timestamp
    );

    event VerifierUpdated(VerificationType verificationType, address verifier);

    // Owner
    address public owner;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(address _ageVerifier) {
        owner = msg.sender;
        ageVerifier = Groth16Verifier(_ageVerifier);
    }

    /**
     * @notice Verify an age proof and store the result on-chain
     * @param userAddress The user's wallet address
     * @param requestHash Unique identifier for this request (from MongoDB _id)
     * @param _pA Proof element A
     * @param _pB Proof element B
     * @param _pC Proof element C
     * @param _pubSignals Public signals (isAdult, challenge, referenceYear)
     */
    function verifyAge(
        address userAddress,
        bytes32 requestHash,
        uint[2] calldata _pA,
        uint[2][2] calldata _pB,
        uint[2] calldata _pC,
        uint[3] calldata _pubSignals
    ) external returns (bool verified) {
        // Call the Groth16 verifier
        verified = ageVerifier.verifyProof(_pA, _pB, _pC, _pubSignals);

        // Generate unique verification ID
        bytes32 verificationId = keccak256(
            abi.encodePacked(
                userAddress,
                msg.sender,
                requestHash,
                block.timestamp
            )
        );

        // Store the record
        verifications[verificationId] = VerificationRecord({
            user: userAddress,
            provider: msg.sender,
            verificationType: VerificationType.Age,
            verified: verified,
            timestamp: block.timestamp,
            requestHash: requestHash
        });

        // Track by user and provider
        userVerifications[userAddress].push(verificationId);
        providerVerifications[msg.sender].push(verificationId);

        // Update stats
        totalVerifications++;
        if (verified) successfulVerifications++;

        // Emit event (VISIBLE ON MANTLESCAN)
        emit ProofVerified(
            verificationId,
            userAddress,
            msg.sender,
            VerificationType.Age,
            verified,
            block.timestamp
        );

        return verified;
    }

    /**
     * @notice Get all verification IDs for a user
     */
    function getUserVerifications(
        address user
    ) external view returns (bytes32[] memory) {
        return userVerifications[user];
    }

    /**
     * @notice Get all verification IDs for a provider
     */
    function getProviderVerifications(
        address provider
    ) external view returns (bytes32[] memory) {
        return providerVerifications[provider];
    }

    /**
     * @notice Get verification details by ID
     */
    function getVerification(
        bytes32 verificationId
    ) external view returns (VerificationRecord memory) {
        return verifications[verificationId];
    }

    /**
     * @notice Get stats
     */
    function getStats()
        external
        view
        returns (uint256 total, uint256 successful, uint256 successRate)
    {
        total = totalVerifications;
        successful = successfulVerifications;
        successRate = totalVerifications > 0
            ? (successfulVerifications * 100) / totalVerifications
            : 0;
    }

    /**
     * @notice Update verifier addresses (owner only)
     */
    function setAgeVerifier(address _ageVerifier) external onlyOwner {
        ageVerifier = Groth16Verifier(_ageVerifier);
        emit VerifierUpdated(VerificationType.Age, _ageVerifier);
    }
}
