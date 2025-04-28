import React from 'react';
import { Bell, Home, HelpCircle, Settings, Shield, Mail, User, FileText, Lock } from "lucide-react";
import { ExpandableTabs } from "./ui/expandable-tabs";

function DefaultDemo() {
  const tabs = [
    { title: "Dashboard", icon: Home },
    { title: "Notifications", icon: Bell },
    { type: "separator" },
    { title: "Settings", icon: Settings },
    { title: "Support", icon: HelpCircle },
    { title: "Security", icon: Shield },
  ];

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-bold mb-2">Default Tabs</h2>
      <ExpandableTabs tabs={tabs} />
    </div>
  );
}

function CustomColorDemo() {
  const tabs = [
    { title: "Profile", icon: User },
    { title: "Messages", icon: Mail },
    { type: "separator" },
    { title: "Documents", icon: FileText },
    { title: "Privacy", icon: Lock },
  ];

  return (
    <div className="flex flex-col gap-4 mt-8">
      <h2 className="text-xl font-bold mb-2">Custom Color Tabs</h2>
      <ExpandableTabs 
        tabs={tabs} 
        activeColor="text-blue-500"
        className="border-blue-200 dark:border-blue-800" 
      />
    </div>
  );
}

const TabsDemo = () => {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Expandable Tabs Demo</h1>
      <DefaultDemo />
      <CustomColorDemo />
    </div>
  );
};

export default TabsDemo;
export { DefaultDemo, CustomColorDemo };