// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SchemaRegistry {
    struct Schema {
        string id;
        string name;
        string description;
        bool isActive;
    }

    mapping(bytes32 => Schema) public schemas;
    bytes32[] public schemaIds;

    event SchemaCreated(bytes32 indexed id, string name, string description);
    event SchemaStatusUpdated(bytes32 indexed id, bool isActive);

    function createSchema(string memory _id, string memory _name, string memory _description) external {
        bytes32 idHash = keccak256(abi.encodePacked(_id));
        require(bytes(schemas[idHash].id).length == 0, "Schema already exists");

        schemas[idHash] = Schema({
            id: _id,
            name: _name,
            description: _description,
            isActive: true
        });
        schemaIds.push(idHash);

        emit SchemaCreated(idHash, _name, _description);
    }

    function getSchema(string memory _id) external view returns (Schema memory) {
        bytes32 idHash = keccak256(abi.encodePacked(_id));
        return schemas[idHash];
    }

    function updateSchemaStatus(string memory _id, bool _isActive) external {
        bytes32 idHash = keccak256(abi.encodePacked(_id));
        require(bytes(schemas[idHash].id).length > 0, "Schema does not exist");
        // In a real app, add access control
        schemas[idHash].isActive = _isActive;
        emit SchemaStatusUpdated(idHash, _isActive);
    }
}
