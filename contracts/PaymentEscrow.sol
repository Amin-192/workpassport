// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
}

contract PaymentEscrow {
    IERC20 public pyusd;
    
    struct Escrow {
        address employer;
        uint256 amount;
        bool claimed;
    }
    
    mapping(address => mapping(bytes32 => Escrow)) public escrows;
    
    event PaymentEscrowed(
        address indexed worker,
        address indexed employer,
        bytes32 indexed credentialHash,
        uint256 amount
    );
    
    event PaymentClaimed(
        address indexed worker,
        bytes32 indexed credentialHash,
        uint256 amount
    );
    
    constructor(address _pyusdAddress) {
        pyusd = IERC20(_pyusdAddress);
    }
    
    function depositPayment(
        address _worker,
        bytes32 _credentialHash,
        uint256 _amount
    ) external {
        require(_amount > 0, "Amount must be greater than 0");
        require(escrows[_worker][_credentialHash].amount == 0, "Payment already escrowed");
        
        require(
            pyusd.transferFrom(msg.sender, address(this), _amount),
            "PYUSD transfer failed"
        );
        
        escrows[_worker][_credentialHash] = Escrow({
            employer: msg.sender,
            amount: _amount,
            claimed: false
        });
        
        emit PaymentEscrowed(_worker, msg.sender, _credentialHash, _amount);
    }
    
    function claimPayment(bytes32 _credentialHash) external {
        Escrow storage escrow = escrows[msg.sender][_credentialHash];
        
        require(escrow.amount > 0, "No payment escrowed");
        require(!escrow.claimed, "Payment already claimed");
        
        escrow.claimed = true;
        
        require(
            pyusd.transfer(msg.sender, escrow.amount),
            "PYUSD transfer failed"
        );
        
        emit PaymentClaimed(msg.sender, _credentialHash, escrow.amount);
    }
    
    function getEscrow(address _worker, bytes32 _credentialHash) 
        external 
        view 
        returns (address employer, uint256 amount, bool claimed) 
    {
        Escrow memory escrow = escrows[_worker][_credentialHash];
        return (escrow.employer, escrow.amount, escrow.claimed);
    }
}