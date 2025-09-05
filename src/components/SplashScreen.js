// src/components/SplashScreen.js

import React from 'react';

export default function SplashScreen({ onDismiss }) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        backgroundColor: '#fff',
        padding: '40px',
        borderRadius: '15px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        maxWidth: '500px',
        textAlign: 'center',
        animation: 'fadeInSplash 0.5s ease-in'
      }}>
        <div style={{
          fontSize: '48px',
          marginBottom: '20px'
        }}>
          🎱
        </div>
        
        <h1 style={{
          color: '#2c3e50',
          marginBottom: '20px',
          fontSize: '28px',
          fontWeight: 'bold'
        }}>
          KC Pool Tournament Manager
        </h1>
        
        <div style={{
          color: '#555',
          lineHeight: '1.6',
          marginBottom: '30px',
          fontSize: '16px'
        }}>
          <p style={{ marginBottom: '15px' }}>
            <strong>Welcome to the complete pool tournament management solution!</strong>
          </p>
          
          <div style={{ textAlign: 'left', margin: '20px 0' }}>
            <div style={{ marginBottom: '10px' }}>
              🏆 <strong>Double elimination brackets</strong> - Winners and losers brackets
            </div>
            <div style={{ marginBottom: '10px' }}>
              🎯 <strong>Smart table assignment</strong> - Automatic table management
            </div>
            <div style={{ marginBottom: '10px' }}>
              📊 <strong>Multiple views</strong> - Bracket and table list formats
            </div>
            <div style={{ marginBottom: '10px' }}>
              💰 <strong>Payout tracking</strong> - Prize distribution management
            </div>
            <div style={{ marginBottom: '10px' }}>
              📁 <strong>Save & load tournaments</strong> - Export/import functionality
            </div>
          </div>
          
          <p style={{ 
            marginTop: '20px', 
            fontSize: '14px', 
            fontStyle: 'italic',
            color: '#666'
          }}>
            Start by entering player names in the sidebar, then click "Start Tournament" to begin!
          </p>
          
          <div style={{
            marginTop: '25px',
            padding: '15px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            borderLeft: '4px solid #667eea'
          }}>
            <div style={{
              fontSize: '14px',
              color: '#495057',
              fontWeight: 'bold',
              marginBottom: '8px'
            }}>
              🚀 Coming Soon
            </div>
            <div style={{
              fontSize: '12px',
              color: '#6c757d',
              lineHeight: '1.4'
            }}>
              • Single elimination & round-robin formats<br/>
              • Live bracket viewing for spectators<br/>
              • Real-time score updates<br/>
              • Advanced statistics & player rankings<br/>
              • Mobile-optimized interface
            </div>
          </div>
        </div>
        
        <button
          onClick={onDismiss}
          style={{
            padding: '12px 30px',
            fontSize: '16px',
            fontWeight: 'bold',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
          }}
        >
          Get Started
        </button>
      </div>
      
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes fadeInSplash {
            from {
              opacity: 0;
              transform: translateY(-20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `
      }} />
    </div>
  );
}