import { useState, useEffect } from 'react';

function ProductCards({ animationState }) {
  const [visibleCards, setVisibleCards] = useState([]);
  
  // 简化为3个卡片 - 1大2小
  const cards = [
    { 
      id: 1, 
      color: '#FFD500', 
      content: 'Explore our range of fun and functional gift products',
      image: null,
      size: 'large' // 大尺寸卡片
    },
    { 
      id: 2, 
      color: '#F5F5F5', 
      content: 'Minimalist stationery for the modern office',
      image: 'book',
      size: 'small' // 小尺寸卡片
    },
    { 
      id: 3, 
      color: '#F0F0F0', 
      content: 'Tools for creative minds',
      image: 'pencil',
      size: 'small' // 小尺寸卡片
    }
  ];

  // 使用useEffect来创建交错显示的卡片动画
  useEffect(() => {
    if (animationState === 'complete') {
      // 清空当前可见卡片
      setVisibleCards([]);
      
      // 延迟加载每张卡片以创建交错效果
      const delay = 150; // 适当的延迟时间
      cards.forEach((card, index) => {
        setTimeout(() => {
          setVisibleCards(prev => [...prev, card]);
        }, index * delay);
      });
    } else {
      setVisibleCards([]);
    }
  }, [animationState]);

  return (
    <div className={`product-cards-container ${animationState === 'complete' ? 'visible' : ''}`}>
      <div className="product-cards">
        {visibleCards.map((card, index) => (
          <div 
            key={card.id}
            className={`card ${card.size}`}
            style={{ 
              backgroundColor: card.color,
              '--delay': `${index * 0.15}s` // 使用CSS变量设置动画延迟
            }}
          >
            {card.content && !card.image && (
              <div className="card-content">
                <p>{card.content}</p>
                <button className="card-button">Explore</button>
              </div>
            )}
            {card.image && (
              <div className="card-image-container">
                <div className="card-content">
                  <p>{card.content}</p>
                </div>
                <div className="card-image">
                  {card.image === 'book' && (
                    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="icon-svg">
                      <g stroke="black" fill="none" strokeWidth="1.5">
                        <path d="M35,30 L65,30 L65,70 L35,70 Z" />
                        <path d="M35,30 L65,30 C65,30 55,40 50,40 C40,40 35,30 35,30 Z" />
                        <line x1="50" y1="40" x2="50" y2="60" />
                      </g>
                    </svg>
                  )}
                  {card.image === 'pencil' && (
                    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="icon-svg">
                      <g stroke="black" fill="none" strokeWidth="1.5">
                        <path d="M35,65 L60,35 L65,40 L40,70 Z" />
                        <path d="M35,65 L40,70 L35,70 Z" />
                      </g>
                    </svg>
                  )}
                  {card.image === 'pencil' && (
                    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="icon-svg">
                      <g stroke="black" fill="none" strokeWidth="1.5">
                        <path d="M35,65 L60,35 L65,40 L40,70 Z" />
                        <path d="M35,65 L40,70 L35,70 Z" />
                      </g>
                    </svg>
                  )}
                </div>
                <button className="card-button">CHAT</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProductCards;
