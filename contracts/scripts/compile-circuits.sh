#!/bin/bash
set -e

# Directories
CIRCUIT_DIR=contracts/circuits
BUILD_DIR=contracts/circuits/build
CONTRACT_DIR=contracts/contracts
PTAU_FILE=$BUILD_DIR/powersOfTau28_hez_final_12.ptau

mkdir -p $BUILD_DIR
mkdir -p $CONTRACT_DIR

# Generate Ptau file locally (safer than downloading)
if [ ! -f "$PTAU_FILE" ]; then
    echo "Generating Ptau file..."
    snarkjs powersoftau new bn128 12 $PTAU_FILE
    snarkjs powersoftau prepare phase2 $PTAU_FILE $PTAU_FILE.prepared
    mv $PTAU_FILE.prepared $PTAU_FILE
fi

compile_circuit() {
    CIRCUIT_NAME=$1
    echo "Compiling $CIRCUIT_NAME..."

    # Compile circuit
    circom $CIRCUIT_DIR/$CIRCUIT_NAME.circom --r1cs --wasm --sym --output $BUILD_DIR

    # Setup
    snarkjs groth16 setup $BUILD_DIR/$CIRCUIT_NAME.r1cs $PTAU_FILE $BUILD_DIR/${CIRCUIT_NAME}_0000.zkey

    # Contribute (dummy contribution for dev)
    echo "test" | snarkjs zkey contribute $BUILD_DIR/${CIRCUIT_NAME}_0000.zkey $BUILD_DIR/${CIRCUIT_NAME}_final.zkey --name="1st Contributor Name" -v

    # Export Verification Key
    snarkjs zkey export verificationkey $BUILD_DIR/${CIRCUIT_NAME}_final.zkey $BUILD_DIR/${CIRCUIT_NAME}_vkey.json

    # Export Solidity Verifier
    # Ensure first letter is capitalized for contract name
    CONTRACT_NAME="Verifier${CIRCUIT_NAME^}"
    snarkjs zkey export solidityverifier $BUILD_DIR/${CIRCUIT_NAME}_final.zkey $CONTRACT_DIR/$CONTRACT_NAME.sol
    
    # Fix Solidity version in generated file if needed (SnarkJS uses 0.6.11 usually, we might want 0.8.x)
    # Using sed to update pragmas isn't always safe but snarkjs output is standard.
    # However, Hardhat handles multiple versions fine if config is set right.
    # Let's just leave it as is for now, Mantle supports standard solc.
    
    echo "$CIRCUIT_NAME compiled and verifier generated!"
}

compile_circuit "age"
compile_circuit "location"

echo "All circuits compiled."
