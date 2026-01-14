// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IVerifier {
    function verifyProof(
        uint[2] calldata _pA,
        uint[2][2] calldata _pB,
        uint[2] calldata _pC,
        uint[] calldata _pubSignals
    ) external view returns (bool);
}

contract DIDRegistry {
    struct Verification {
        bool isVerified;
        uint256 timestamp;
        uint256 expiration;
    }

    // Mapping: User Address -> Schema ID (keccak256) -> Verification
    mapping(address => mapping(bytes32 => Verification)) public verifications;

    // Mapping: Schema ID -> Verifier Contract Address
    mapping(bytes32 => address) public verifiers;

    event VerifierSet(bytes32 indexed schemaId, address verifierAddress);
    event ProofVerified(address indexed user, bytes32 indexed schemaId, uint256 timestamp);

    function setVerifier(string memory _schemaId, address _verifier) external {
        bytes32 idHash = keccak256(abi.encodePacked(_schemaId));
        verifiers[idHash] = _verifier;
        emit VerifierSet(idHash, _verifier);
    }

    function verifyAndRegister(
        string memory _schemaId,
        uint[2] calldata _pA,
        uint[2][2] calldata _pB,
        uint[2] calldata _pC,
        uint[] calldata _pubSignals
    ) external returns (bool) {
        bytes32 idHash = keccak256(abi.encodePacked(_schemaId));
        address verifierAddr = verifiers[idHash];
        require(verifierAddr != address(0), "Verifier not set for schema");

        // Call verifier
        // We use low-level staticcall to handle dynamic array size difference in interface definition if needed,
        // but here we define interface with uint[] calldata which usually works with generated verifiers 
        // if they adapted their inputs or if we match specific lengths.
        // However, generated verifiers usually have fixed size array e.g. uint[3]. 
        // Calling with uint[] memory might fail ABI encoding if not careful.
        // Let's rely on standard function selection.
        
        // Attempt low-level call to bypass strict array length check in Interface if mismatched
        (bool success, bytes memory data) = verifierAddr.staticcall(
            abi.encodeWithSignature(
                "verifyProof(uint256[2],uint256[2][2],uint256[2],uint256[])",
                _pA, _pB, _pC, _pubSignals
            )
        );
        
        // If the signature with dynamic array doesn't match the fixed array selector, 
        // we might need to know the specific length.
        // Groth16Verifier verifyProof signature selector depends on arguments.
        // verifyProof(uint256[2],uint256[2][2],uint256[2],uint256[3]) has different selector than ...uint256[4]).
        
        // FALLBACK: Since we know we have Age (3 signals) and Location (4 signals), 
        // we can try specific encodings or implement specific functions.
        // For simplicity in this demo, let's implement specific functions for Age and Location 
        // to ensure selector matches generated contract.
        
        revert("Use specific verification functions: verifyAge or verifyLocation");
    }

    function verifyAge(
        uint[2] calldata _pA,
        uint[2][2] calldata _pB,
        uint[2] calldata _pC,
        uint[3] calldata _pubSignals
    ) external {
        string memory schemaId = "age-check";
        bytes32 idHash = keccak256(abi.encodePacked(schemaId));
        address verifierAddr = verifiers[idHash];
        require(verifierAddr != address(0), "Age verifier not set");

        // Interface with fixed size 3
        (bool success, bytes memory data) = verifierAddr.staticcall(
            abi.encodeWithSignature(
                "verifyProof(uint256[2],uint256[2][2],uint256[2],uint256[3])",
                _pA, _pB, _pC, _pubSignals
            )
        );
        require(success, "Verifier call failed");
        bool verified = abi.decode(data, (bool));
        require(verified, "Invalid Proof");

        verifications[msg.sender][idHash] = Verification({
            isVerified: true,
            timestamp: block.timestamp,
            expiration: block.timestamp + 365 days
        });

        emit ProofVerified(msg.sender, idHash, block.timestamp);
    }

    function verifyLocation(
        uint[2] calldata _pA,
        uint[2][2] calldata _pB,
        uint[2] calldata _pC,
        uint[4] calldata _pubSignals
    ) external {
        string memory schemaId = "location-check";
        bytes32 idHash = keccak256(abi.encodePacked(schemaId));
        address verifierAddr = verifiers[idHash];
        require(verifierAddr != address(0), "Location verifier not set");

        // Interface with fixed size 4 (out, providerLat, providerLon, radius)
        (bool success, bytes memory data) = verifierAddr.staticcall(
            abi.encodeWithSignature(
                "verifyProof(uint256[2],uint256[2][2],uint256[2],uint256[4])",
                _pA, _pB, _pC, _pubSignals
            )
        );
        require(success, "Verifier call failed");
        bool verified = abi.decode(data, (bool));
        require(verified, "Invalid Proof");

        verifications[msg.sender][idHash] = Verification({
            isVerified: true,
            timestamp: block.timestamp,
            expiration: block.timestamp + 1 days // Location might expire sooner
        });

        emit ProofVerified(msg.sender, idHash, block.timestamp);
    }
}
