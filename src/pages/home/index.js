import React, { useEffect, useState } from 'react'
import { actions as dashbaordActions } from "../../store/dashboard";
import {connect} from "react-redux";
import PatientList from './patientList';
import ChatComponent from './patientChat';

const Home = ({workFlowData, WorlFlow}) => {
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [chatCompletionStatus, setChatCompletionStatus] = useState({});

    useEffect(() => {
        workFlowData()
    }, [])

    const handleChatComplete = (patientId, isCompleted) => {
        setChatCompletionStatus(prev => ({
            ...prev,
            [patientId]: isCompleted
        }));
    };

    const handleCloseChat = () => {
        setSelectedPatient(null);
    };

  return (
    <div style={{ 
      display: 'flex', 
      height: '100vh', 
      width: '100%',
      backgroundColor: '#f5f5f5'
    }}>
      {/* Patient List - 25% width */}
      <div style={{ 
        width: '25%', 
        backgroundColor: 'white',
        borderRight: '2px solid #e8e8e8',
        boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
        zIndex: 1
      }}>
        <PatientList 
          onPatientSelect={setSelectedPatient}
          selectedPatient={selectedPatient}
          chatCompletionStatus={chatCompletionStatus}
          onChatComplete={handleChatComplete}
        />
      </div>
      
      {/* Chat Component - 75% width */}
      <div style={{ 
        width: '75%', 
        display: 'flex', 
        flexDirection: 'column',
        backgroundColor: 'white'
      }}>
        {selectedPatient ? (
          <ChatComponent 
            selectedPatient={selectedPatient}
            onChatComplete={handleChatComplete}
            onClose={handleCloseChat}
          />
        ) : (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%',
            padding: '40px',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '48px',
              color: '#d9d9d9',
              marginBottom: '20px'
            }}>
              💬
            </div>
            <div style={{
              fontSize: '24px',
              color: '#666',
              marginBottom: '10px',
              fontWeight: '500'
            }}>
              Welcome to Patient Chat
            </div>
            <div style={{
              fontSize: '16px',
              color: '#999'
            }}>
              Select a patient from the list to start chatting
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
const enhancer = connect(
    (state) => ({
      WorlFlow: state
    }),
    {
      workFlowData:dashbaordActions.workFlowAction
    }
  );
export default enhancer(Home)