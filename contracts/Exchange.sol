// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "hardhat/console.sol";
import "./Token.sol";

contract Exchange {
    address public feeAccount;
    uint256 public feePercent;
    uint256 public ordersCount;
    //------------START Mapping ------------------
    mapping(address => mapping(address => uint256)) public tokens;

    mapping(uint256 => _Order) orders; // this is a map of order id to _Order struct
    //------------END ------------------

    // Structs
    struct _Order {
        uint256 id; // Unique identifier of the order
        address user; // User who made order
        address tokenGet; // Address of the token they receive
        uint256 amountGet; // Amount of tokens they receive
        address tokenGive; // Address of the token they give
        uint256 amountGive; // Amount of tokens they give
        uint256 timestamp; // when the order was created
    }

    // Events
    event Deposit(
        address token,
        address indexed user,
        uint256 amount,
        uint256 balance
    );
    event Withdraw(
        address token,
        address indexed user,
        uint256 amount,
        uint256 balance
    );
    event Order(
        uint256 id,
        address user,
        address tokenGet,
        uint256 amountGet,
        address tokenGive,
        uint256 amountGive,
        uint256 timestamp
    );

    constructor(address _feeAccount, uint256 _feePercent) {
        feeAccount = _feeAccount;
        feePercent = _feePercent;
    }

    function balanceOf(address _token, address _user)
        public
        view
        returns (uint256)
    {
        return tokens[_token][_user];
    }

    // -----------------------------------------------------------------------------
    // Deposit and Withdraw token
    function depositToken(address payable _token, uint256 _amount) public {
        Token token = Token(_token);
        // transfer tokens to exchange
        require(token.transferFrom(msg.sender, address(this), _amount));
        // update user balance
        tokens[_token][msg.sender] += _amount;
        // Emit event
        emit Deposit(_token, msg.sender, _amount, tokens[_token][msg.sender]);
    }

    function withdrawToken(address _token, uint256 _amount) public {
        require(
            tokens[_token][msg.sender] >= _amount,
            "Exchange: insufficient balance"
        );
        // transfer tokens to user
        Token token = Token(_token);
        require(token.transfer(msg.sender, _amount));
        // update user balance
        tokens[_token][msg.sender] -= _amount;
        // Emit event
        emit Withdraw(_token, msg.sender, _amount, tokens[_token][msg.sender]);
    }

    // ------------------------------END-----------------------------------------------

    // -----------------------------------------------------------------------------
    // Make order and Cancel order
    function makeOrder(
        address _tokenGet,
        uint256 _amountGet,
        address _tokenGive,
        uint256 _amountGive
    ) public {
        // Prevent orders if tokens aren't on exchange
        require(
            balanceOf(_tokenGive, msg.sender) >= _amountGive,
            "Exchange: insufficient balance"
        );

        // Token Give (the token they want to spend)
        // Token Get (the token they want to receive)

        ordersCount++;
        orders[ordersCount] = _Order(
            ordersCount,
            msg.sender,
            _tokenGet,
            _amountGet,
            _tokenGive,
            _amountGive,
            block.timestamp
        );
        // Emit Order event
        emit Order(
            ordersCount,
            msg.sender,
            _tokenGet,
            _amountGet,
            _tokenGive,
            _amountGive,
            block.timestamp
        );
    }
}
