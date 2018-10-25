import React, { Component } from 'react'
import './App.css'

class App extends Component {
  myName
  otherName
  myConnection

  connection = new WebSocket('ws://localhost:9090/')

  send = (data) => this.connection.send(JSON.stringify(data))

  handleLogin = (e) => {
    e.preventDefault()
    this.myName = e.target.name.value
    this.send({type: "login", name: this.myName})

    this.connection.onmessage = (message) => {
      const data = JSON.parse(message.data)
      switch(data.type) {
        case "login":
          this.onLogin(data)
          break
        case "offer":
          this.onOffer(data)
          break
        case "answer":
          this.onAnswer(data)
          break
        case "candidate":
          this.onCandidate(data)
          break
        default:
          break
      }
    }
  }

  onLogin = (data) => {
    if (!data.success) {
      alert("Name is being used. Choose a different name.")
    } else {
      this.refs.name.disabled = true

      const configuration = {"iceServers": [{"url":"stun:stun.1.google.com:19302"}]}
      this.myConnection = new RTCPeerConnection(configuration)

      this.myConnection.onicecandidate = (e) => {
        if (e.candidate) {
          this.send({type: "candidate", candidate: e.candidate, name: this.otherName})
        }
      }

      this.openDataChannel()
    }
  }

  onOffer = (data) => {
    this.myConnection.setRemoteDescription(new RTCSessionDescription(data.offer))
    this.myConnection.createAnswer(answer => {
      this.refs.connectTo.value = data.name
      this.otherName = data.name
      this.refs.connectTo.disabled = true
      this.myConnection.setLocalDescription(answer)
      this.send({type: "answer", answer: answer, name: data.name})
    }, console.log)
  }

  onAnswer = (data) => {
    this.myConnection.setRemoteDescription(new RTCSessionDescription(data.answer))
  }

  onCandidate = (data) => {
    this.myConnection.addIceCandidate(new RTCIceCandidate(data.candidate))
  }

  handleConnect = (e) => {
    e.preventDefault()
    this.refs.connectTo.disabled = true
    this.otherName = e.target.connectTo.value
    this.myConnection.createOffer(offer => {
      this.myConnection.setLocalDescription(offer)
      this.send({type: "offer", offer: offer, name: this.otherName})
    }, console.log)
  }

  handleMessaging = (e) => {
    e.preventDefault()
    const message = e.target.messageToSend.value
    e.target.messageToSend.value = ""
    this.dataChannel.send(message)
    // FIX THIS LATER
    document.querySelector('#messagesInner').appendChild(document.createTextNode(`${this.myName}: ${message}`))
    document.querySelector('#messagesInner').appendChild(document.createElement('BR'))
  }

  openDataChannel = () => {
    this.myConnection.ondatachannel = (e) => {
      e.channel.onmessage = (data) => {
        // FIX THIS LATER
        document.querySelector('#messagesInner').appendChild(document.createTextNode(`${this.otherName}: ${data.data}`))
        document.querySelector('#messagesInner').appendChild(document.createElement('BR'))
      }
    }

    const config = { reliable: true }
    this.dataChannel = this.myConnection.createDataChannel("myDataChannel", config)
  }

  render() {
    return (
      <div className="App">
        <div id="forms">
          <form onSubmit={this.handleLogin}>
            <label>Username</label><br/>
            <input type="text" id="name" ref="name"/><br/>
            <input type="Submit" value="Log In" readOnly/>
          </form>
          <form onSubmit={this.handleConnect}>
            <label>Connect To</label><br/>
            <input type="text" id="connectTo" ref="connectTo"/><br/>
            <input type="Submit" value="Connect" readOnly/>
          </form>
          <form onSubmit={this.handleMessaging}>
            <label>Message</label><br/>
            <input type="text" id="messageToSend"/><br/>
            <input type="Submit" value="Send" readOnly/>
          </form>
        </div>
        <div id="messages">
          <h3>Messages</h3>
          <div id="messagesInner">
          </div>
        </div>
      </div>
    )
  }
}

export default App
