import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import notie from 'notie';



export default class LoginPage extends Component {
    constructor() {
        super();
        this.state = {username:'',password:''};
        this.onUsernameChange = (e) => {
            var username = e.target.value;
            this.setState({username});
        };
        this.onPasswordChange = (e) => {
            var password = e.target.value;
            this.setState({password});
        };
        this.login.bind(this);
    }

    componentDidMount() {
        if (localStorage.getItem("username") !== null) {
            this.props.login(
                localStorage.getItem("username"), 
                localStorage.getItem("password")
            );
        }
    }

    login(e) {
        e.preventDefault();
        var {username, password} = this.state;
        
        this.props.login(username, password)
    }
    render() {
        return (
            <div>
                <h1>Welcome to TEST Steem DNS. The online manager for your blockchain-based domain.</h1>
                <form onSubmit={this.login.bind(this)}>
                    <label htmlFor="username">Username</label>
                    <input type="text" onChange={this.onUsernameChange} /><br/>
                    <label htmlFor="password">Active Key (or master password) </label>
                    <input type="password" onChange={this.onPasswordChange} />
                    <button>Login</button>
                </form>

                <small>Operated by @Someguy123</small>
            </div>
        )
    }
}

