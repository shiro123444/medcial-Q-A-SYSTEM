import React, { useState, useRef, useEffect } from "react";
import "./expandable-tabs.css"; // We'll create this file for explicit styles

// Simplified class name utility function
function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

/**
 * A simplified ExpandableTabs component that doesn't rely on external libraries
 */
export function ExpandableTabs({
  tabs,
  className,
  activeColor = "text-primary",
  onChange,
}) {
  const [selected, setSelected] = useState(null);
  const tabsRef = useRef(null);

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (tabsRef.current && !tabsRef.current.contains(event.target)) {
        setSelected(null);
        onChange?.(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onChange]);

  const handleSelect = (index) => {
    setSelected(index);
    onChange?.(index);
  };

  return (
    <div
      ref={tabsRef}
      className={classNames(
        "expandable-tabs-container",
        className
      )}
    >
      {tabs.map((tab, index) => {
        if (tab.type === "separator") {
          return (
            <div 
              key={`separator-${index}`} 
              className="separator" 
              aria-hidden="true" 
            />
          );
        }

        // Use a simplified approach for icons
        const IconComponent = tab.icon;
        
        return (
          <button
            key={tab.title || index}
            onClick={() => handleSelect(index)}
            className={classNames(
              "tab-button",
              selected === index ? `selected ${activeColor}` : "unselected"
            )}
            style={{
              gap: selected === index ? '0.5rem' : 0,
              paddingLeft: selected === index ? '1rem' : '0.5rem',
              paddingRight: selected === index ? '1rem' : '0.5rem',
              transition: 'all 0.6s'
            }}
          >
            {/* Render icon if available */}
            {IconComponent && (
              <span className="icon-wrapper">
                <IconComponent size={20} />
              </span>
            )}
            
            {/* Title with conditional visibility */}
            {selected === index && (
              <span 
                className="tab-title"
                style={{
                  opacity: 1,
                  width: 'auto',
                  transition: 'opacity 0.6s, width 0.6s'
                }}
              >
                {tab.title}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}