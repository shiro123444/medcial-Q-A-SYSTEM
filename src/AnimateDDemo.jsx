import { useState, useEffect } from 'react';

const AnimatedLanding = () => {
  const [animationState, setAnimationState] = useState('initial');
  const [restart, setRestart] = useState(0);

  useEffect(() => {
    // Reset to initial state first
    setAnimationState('initial');
    
    // Animation sequence
    const timer1 = setTimeout(() => setAnimationState('logoZoom'), 1000);
    const timer2 = setTimeout(() => setAnimationState('showNavbar'), 2500);
    const timer3 = setTimeout(() => setAnimationState('showCards'), 3000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [restart]);

  // Styles
  const styles = {
    container: {
      fontFamily: 'Helvetica Neue, Arial, sans-serif',
      position: 'relative',
      height: '100vh',
      width: '100%',
      overflow: 'hidden',
      backgroundColor: '#ffffff',
    },
    logoContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 1.5s cubic-bezier(0.16, 1, 0.3, 1)',
      zIndex: 100,
      transform: animationState !== 'initial' ? 'translateY(0)' : 'translateY(0)',
      height: animationState !== 'initial' ? '120px' : '100vh',
    },
    logoText: {
      fontSize: animationState !== 'initial' ? '4rem' : '10vw',
      fontWeight: 800,
      letterSpacing: '-0.02em',
      color: '#000',
      transition: 'font-size 1.5s cubic-bezier(0.16, 1, 0.3, 1)',
      position: 'relative',
    },
    registered: {
      fontSize: '0.4em',
      verticalAlign: 'super',
    },
    tagline: {
      marginTop: '20px',
      fontSize: '1rem',
      opacity: animationState !== 'initial' ? 1 : 0,
      transition: 'opacity 1s ease 1s',
    },
    navbar: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      width: '100%',
      height: '60px',
      padding: '0 20px',
      position: 'absolute',
      top: '120px',
      left: 0,
      backgroundColor: '#ffffff',
      zIndex: 90,
      transform: animationState === 'showNavbar' || animationState === 'showCards' 
        ? 'translateY(0)' 
        : 'translateY(-100px)',
      opacity: animationState === 'showNavbar' || animationState === 'showCards' ? 1 : 0,
      transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
    },
    navLeft: {
      display: 'flex',
      alignItems: 'center',
    },
    navRight: {
      display: 'flex',
      alignItems: 'center',
    },
    navItem: {
      marginRight: '20px',
      padding: '5px 0',
      cursor: 'pointer',
      position: 'relative',
      fontSize: '0.9rem',
    },
    productCards: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '20px',
      padding: '20px',
      marginTop: '180px',
      opacity: animationState === 'showCards' ? 1 : 0,
      transform: animationState === 'showCards' ? 'translateY(0)' : 'translateY(30px)',
      transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
    },
    card: (index) => ({
      height: '200px',
      borderRadius: '4px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      backgroundColor: index === 0 ? '#FFD500' : '#F5F5F5',
      animation: animationState === 'showCards' 
        ? `fadeSlideUp 0.6s ease forwards ${index * 0.15}s` 
        : 'none',
      opacity: animationState === 'showCards' ? 1 : 0,
      transform: animationState === 'showCards' ? 'translateY(0)' : 'translateY(20px)',
    }),
    cardContent: {
      textAlign: 'center',
      fontSize: '0.9rem',
      lineHeight: 1.4,
      fontWeight: 500,
    },
    restartBtn: {
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      padding: '10px 20px',
      backgroundColor: '#000',
      color: '#fff',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      zIndex: 1000,
    }
  };

  // Mock data
  const navItems = ['Shop', 'Category', 'Featured', 'Price'];
  const cards = [
    { 
      id: 1, 
      content: 'Explore our range of fun and functional gift products',
      image: null 
    },
    { id: 2, content: null, image: 'book' },
    { id: 3, content: null, image: 'pencil' },
    { id: 4, content: null, image: 'bookmark' }
  ];

  return (
    <div style={styles.container}>
      <div style={styles.logoContainer}>
        <h1 style={styles.logoText}>
          Thinking Gifts<span style={styles.registered}>®</span>
        </h1>
        <p style={styles.tagline}>Where fun meets functionality</p>
      </div>

      <nav style={styles.navbar}>
        <div style={styles.navLeft}>
          {navItems.map((item, index) => (
            <div key={index} style={styles.navItem}>
              {item}
            </div>
          ))}
        </div>
        <div style={styles.navRight}>
          <div style={{...styles.navItem, marginLeft: '20px'}}>£ GBP</div>
          <div style={{...styles.navItem, marginLeft: '20px'}}>Trade</div>
          <div style={{...styles.navItem, marginLeft: '20px'}}>Bag</div>
        </div>
      </nav>

      <div style={styles.productCards}>
        {cards.map((card, index) => (
          <div key={card.id} style={styles.card(index)}>
            {card.content && (
              <div style={styles.cardContent}>
                <p>{card.content}</p>
              </div>
            )}
            {card.image && (
              <div style={{ width: '60%', height: '60%' }}>
                {card.image === 'book' && (
                  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                    <g stroke="black" fill="none" strokeWidth="1.5">
                      <path d="M30,30 L70,30 L70,70 L30,70 Z" />
                      <path d="M30,30 L70,30 C70,30 60,40 50,40 C40,40 30,30 30,30 Z" />
                      <line x1="50" y1="40" x2="50" y2="60" />
                    </g>
                  </svg>
                )}
                {card.image === 'pencil' && (
                  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                    <g stroke="black" fill="none" strokeWidth="1.5">
                      <path d="M30,70 L60,30 L70,40 L40,80 Z" />
                      <path d="M30,70 L40,80 L30,80 Z" />
                    </g>
                  </svg>
                )}
                {card.image === 'bookmark' && (
                  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                    <g stroke="black" fill="none" strokeWidth="1.5">
                      <path d="M40,30 L60,30 L60,70 L50,60 L40,70 Z" />
                      <circle cx="50" cy="40" r="5" />
                    </g>
                  </svg>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <button 
        style={styles.restartBtn}
        onClick={() => setRestart(prev => prev + 1)}
      >
        Restart Animation
      </button>

      <style>
        {`
          @keyframes fadeSlideUp {
            0% {
              opacity: 0;
              transform: translateY(20px);
            }
            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </div>
  );
};

export default AnimatedLanding;