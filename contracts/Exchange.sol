// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "hardhat/console.sol";
import "./Token.sol";

contract Exchange {
    address public feeAccount;
    uint256 public feePercent;
    mapping(address => mapping(address => uint256)) public tokens;
    event Deposit(
        address token,
        address indexed user,
        uint256 amount,
        uint256 balance
    );

    constructor(address _feeAccount, uint256 _feePercent) {
        feeAccount = _feeAccount;
        feePercent = _feePercent;
    }

    // -----------------------------------------------------------------------------
    // Deposit and Withdraw token
    function depositToken(address payable _token, uint256 _amount) public {
        Token token = Token(_token);
        // transfer tokens to exchange
        require(token.transferFrom(msg.sender, address(this), _amount));
        // update user balance
        tokens[_token][msg.sender] += _amount;
        // TODO:Emit event
        emit Deposit(_token, msg.sender, _amount, tokens[_token][msg.sender]);
    }

    // -----------------------------------------------------------------------------

    function balanceOf(address _token, address _user)
        public
        view
        returns (uint256)
    {
        return tokens[_token][_user];
    }
}
