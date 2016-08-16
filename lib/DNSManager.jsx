import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import notie from 'notie';

// Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};

export default class DNSManager extends Component {
    constructor() {
        super();
        this.state = {
            records: [], 
            currentEditor: {
                type: 'A',
                subdomain: '',
                value: '',
                priority: '',
            }
        };
        // debugging
        this.dataChange = (e) => {
            var data = e.target.value;
            this.setState({data});
        }
        // debugging
        this.send = (e) => {
            
            let options = steemJS.steemRPC.Client.get()['options'];
            // reset and reconnect socket because it's unreliable...

            var Client = window.steemJS.steemRPC.Client;
            console.log(Client.close())
            var Api = Client.reset(options);
            console.log(Api);
            Api.initPromise.then(response => {
                console.log("Api ready:", response);
                var tr = new window.steemJS.TransactionBuilder();
                tr.add_type_operation("account_update", JSON.parse(this.state.data));
                tr.process_transaction(this.props.user, null, true);
                window.temptx = tr;
            });
        }
        this.onEditorChange = (e) => {
            var tg = e.target;
            let value = tg.value, 
                name = tg.id.split('editor-')[1];
            
            this.setState((prevState) => {
                let currentEditor = prevState.currentEditor;
                currentEditor[name] = value;
                return {currentEditor};
            });
            window.tg = tg;
        }
        this.addRecord = (e) => {
            let items = this.state.currentEditor;
            var record = [];
            record.push(items.subdomain);
            record.push(items.type);
            record.push(items.value);
            try {
                if(items.type == 'MX') record.push(parseInt(items.priority));
            } catch(e) {
                notie.alert(3, 'Invalid MX priority. Must be numeric', 3);
                return;
            }

            if (items.type == 'A' && !this.isIp(items.value)) {
                notie.alert(3, 'A Records must be set to a valid IP address', 3);
                return false;
            }            
            if (items.subdomain == '') {
                notie.alert(2, 'Warning: Subdomain must be filled in. For the root domain enter @ as the subdomain.', 3);
                return false;
            } 

            var dupe_check = this.state.records.filter((r) => JSON.stringify(r) == JSON.stringify(record));
            if (dupe_check.length > 0) {
                notie.alert(3, 'Error: You already have a record like that, which is exactly the same!', 3);
                return false;
            }
            this.setState((prevState) => {
                let records = prevState.records;
                records.push(record)
                return {
                    records, 
                    currentEditor: {
                        type: 'A',
                        subdomain: '',
                        value: '',
                        priority: '',
                    }
                };
            });
        }
        this.save = (e) => {
            document.getElementById('loading-overlay').style.display = "block";
            // just make sure they're sane before publishing...
            var records = this.state.records.filter(this.validateRecord.bind(this));
            var original_userjson;
            try {
                original_userjson = JSON.parse(this.props.account.json_metadata);
            } catch(e) {
                console.error('Error parsing user JSON, clearing all data. Data was: ', this.props.account.json_metadata)
                original_userjson = {};
            }

            if(!('dns' in original_userjson)) original_userjson['dns'] = {};
            if(!('records' in original_userjson['dns'])) original_userjson['dns']['records'] = [];

            original_userjson['dns']['records'] = records;
            
            try {

                // let options = steemJS.steemRPC.Client.get()['options'];
                // var Api = window.steemJS.steemRPC.get();
                // console.log(Client.close())
                // var Api = Client.reset(options);
                // console.log(Api);
                // wait 2 seconds because this never works properly
                // Api.initPromise.then(response => {

                var tr = new window.steemJS.TransactionBuilder();
                let new_data = {
                    account: this.props.user.name,
                    memo_key: this.props.account.memo_key,
                    json_metadata: JSON.stringify(original_userjson)
                }
                tr.add_type_operation("account_update", new_data)
                window.pending_tx = tr.process_transaction(this.props.user, null, true)
                pending_tx.then((res) => {
                    console.log('successfully sent?');
                }, (err) => {
                    console.error('uh oh error: ', err);
                }).catch((e) => {
                    console.error('uh oh CATCH error: ', err);
                });
                document.getElementById('loading-overlay').style.display = "none";
                notie.alert(1, 'Your account was updated. Changes should be live within 60 seconds.', 3);
                // });
                

            } catch (e) {
                document.getElementById('loading-overlay').style.display = "none";
                notie.alert(3, 'There was an error building the transaction to update your JSON Metadata', 5);
                console.error('SteemDNS Transaction Error: ', e);
            }
        }
        this.loadRecords.bind(this);
        this.validateRecord.bind(this);
    }

    isIp(ip) {
        var pattern = /\b(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/;
        return pattern.test(ip);
    }

    validateRecord(record) {
        // Is it an array?
        if (!Array.isArray(record)) return false;
        // Does it have 3 or 4 entries?
        if (record.length < 3 || record.length > 4) return false;
        // If it's an A record, is the value an IP?
        if (record[0] == 'A' && !this.isIp(record[2])) return false;

        // Passed all tests
        return true;
    }

    loadRecords(rjson) {
        var data;
        try {
            data = JSON.parse(rjson);
        } catch(e) {
            notie.alert(3, 'Invalid JSON in your metadata. Please correct your JSON via cli_wallet, or it will be ERASED when you update your records.', 10)
        }
        console.log('Loading records...');
        if('dns' in data && 'records' in data['dns']) {
            console.log('Found records. Cleaning.');        
            var clean_records = data['dns']['records'].filter(this.validateRecord.bind(this));
            console.log('Clean records are: ', clean_records);                    
            this.setState({records: clean_records});
        }
    }

    componentDidMount() {
        let md = this.props.account.json_metadata;
        console.log('mounted');
        if(md == '' || md == '{}') {
            console.log('empty json');
            return;
        }
        this.loadRecords(md);

    }

    deleteRecord(idx) {
        console.log(idx);
        this.setState((prevState) => {
            var records = prevState.records;
            records.remove(parseInt(idx));
            return {records};
        });
    }

    logout() {
        localStorage.clear();
        window.location.reload(true);
    }

    render() {

        let Records = this.state.records.map((r, idx) => (
            <tr className="tbrecord" key={idx} >
                <td>{r[0]}</td>
                <td>{r[1]}</td>
                <td>{r[2]}</td>
                <td>{r.length > 3 ? r[3] : 'N/A'}</td>
                <td><button className="btn full solid red" onClick={this.deleteRecord.bind(this, idx)}>-</button></td>
            </tr>
        ));
        return (
            <div>
                <h1>Logged in as @{this.props.user.name} <a style={{float: 'right'}} href="#" onClick={this.logout}>Logout</a></h1>
                <hr/>
                <h2>Record Editor</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Subdomain</th>
                            <th>Type</th>
                            <th>Value</th>
                            <th>Priority (Optional, for MX) </th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {Records}
                        <tr>
                            <td>
                                <input type="text" id="editor-subdomain" value={this.state.currentEditor.subdomain} onChange={this.onEditorChange} />
                            </td>
                            <td>
                                <select name="editor-type" id="editor-type" value={this.state.currentEditor.type} onChange={this.onEditorChange} >
                                    <option value="A">A</option>
                                    <option value="CNAME">CNAME</option>
                                    <option value="TXT">TXT</option>
                                    <option value="MX">MX</option>
                                </select>
                            </td>
                            <td>
                                <input type="text" id="editor-value" value={this.state.currentEditor.value} onChange={this.onEditorChange} />
                            </td>
                            <td>
                                <input type="text" id="editor-priority" value={this.state.currentEditor.priority} onChange={this.onEditorChange} />
                            </td>
                            <td>
                                <button className="btn full solid blue" onClick={this.addRecord}>+</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <button className="btn full solid green" onClick={this.save}>Save Records Now</button>
                <hr/>
                <h2>Help</h2>
                <p>Check out the original posts <a href="https://steemit.com/steemit/@someguy123/steem-dns-your-username-dot-steem-dns-on-the-blockchain" target="_BLANK">HERE</a> and <a href="#" target="_BLANK">HERE</a></p>
                <h3><strong>How to view?</strong></h3>
                <p>If you have your computers DNS pointed at our server, you can visit <a href={`http://${this.props.user.name}.steem`}>{`http://${this.props.user.name}.steem`}</a></p>
                <p>If not, you can use our proxy domain (shorter ones coming soon) at <a href={`http://${this.props.user.name}.user.steem.network`}>{`http://${this.props.user.name}.user.steem.network`}</a> </p>
                <h3><strong>Record Types</strong></h3>
                <p>
                    <strong>A</strong> - Points the (sub)domain to an IP address, such as 127.0.0.1<br/>
                    <strong>CNAME</strong> - Aliases the domain to a different domain. Be aware that the other server must have appropriate host settings or this won't work<br/>
                    <strong>TXT</strong> - Used for putting raw text into a domain record, often for verification for SSL or Search Engines<br/>
                    <strong>MX</strong> - Used for emails. This obviously will not actually work unless .steem becomes a real TLD<br/>
                </p>
            </div>
        )
    }
}