"use client"; 
import { useState, useEffect, useRef, useContext, createContext, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Home as HomeIcon, CheckSquare, Lightbulb, FileText, 
  FolderKanban, Plus, Trash2, Check, 
  Calendar, Menu, ChevronDown, ChevronUp, X, Clock, CircleDot, Layers
} from "lucide-react";

// Create a navigation context
interface NavigationContextType {
  onNavigate: (page: string) => void;
  activePage: string;
}

const NavigationContext = createContext<NavigationContextType>({
  onNavigate: () => {},
  activePage: "home"
});

// Update the global styles
const globalStyles = `
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: rgba(30, 30, 30, 0.6);
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb {
    background: rgba(59, 130, 246, 0.5);
    border-radius: 4px;
    transition: background 0.2s ease;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: rgba(59, 130, 246, 0.7);
  }

  ::-webkit-scrollbar-corner {
    background: transparent;
  }

  * {
    scrollbar-width: thin;
    scrollbar-color: rgba(59, 130, 246, 0.5) rgba(30, 30, 30, 0.6);
  }
  
  textarea {
    resize: none;
  }
`;

// Define types for our data structures
interface Task {
  id: number;
  text: string;
  completed: boolean;
  createdAt: string;
  dueDate?: string;
  project?: string;
  details?: string;
}

interface Idea {
  id: number;
  title: string;
  text: string;
  createdAt: string;
}

interface Note {
  id: number;
  text: string;
  createdAt: string;
  category?: string;
}

interface Project {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  color: string;
  taskCount: number;
}

// Define prop types for components
interface NavbarProps {
  onNavigate: (page: string) => void;
  activePage: string;
}

interface HomePageProps {
  onNavigate: (page: string) => void;
}

// Format date for display
function formatDate(dateString: string | undefined): string {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Calculate days remaining
function daysRemaining(dateString: string | undefined): string {
  if (!dateString) return '';
  
  const dueDate = new Date(dateString);
  if (isNaN(dueDate.getTime())) return '';
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const timeDiff = dueDate.getTime() - today.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
  
  if (daysDiff < 0) return `${Math.abs(daysDiff)} days overdue`;
  if (daysDiff === 0) return 'Due today';
  if (daysDiff === 1) return 'Due tomorrow';
  return `${daysDiff} days left`;
}

// Custom date picker component
function DatePicker({ 
  value, 
  onChange 
}: { 
  value: string, 
  onChange: (date: string) => void 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(value || '');
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const datePickerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // If value changes externally, update the selected date
    if (value) {
      setSelectedDate(value);
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        setMonth(date.getMonth());
        setYear(date.getFullYear());
      }
    }
  }, [value]);
  
  useEffect(() => {
    // Close the dropdown when clicking outside
    function handleClickOutside(event: MouseEvent) {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };
  
  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };
  
  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(month, year);
    const firstDay = getFirstDayOfMonth(month, year);
    const days = [];
    
    // Add empty slots for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8 w-8"></div>);
    }
    
    // Add actual days
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const dateString = date.toISOString().split('T')[0];
      const isSelected = selectedDate === dateString;
      const isToday = new Date().toISOString().split('T')[0] === dateString;
      
      days.push(
        <button
          key={i}
          onClick={() => {
            setSelectedDate(dateString);
            onChange(dateString);
          }}
          className={`h-8 w-8 rounded-full flex items-center justify-center text-sm transition-colors ${
            isSelected 
              ? 'bg-blue-500 text-white' 
              : isToday 
                ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30' 
                : 'hover:bg-[#333333] text-gray-300'
          }`}
        >
          {i}
        </button>
      );
    }
    
    return days;
  };
  
  const goToPreviousMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };
  
  const goToNextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };
  
  const clearDate = () => {
    setSelectedDate('');
    onChange('');
    setIsOpen(false);
  };
  
  const setToday = () => {
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];
    setSelectedDate(dateString);
    onChange(dateString);
    setMonth(today.getMonth());
    setYear(today.getFullYear());
  };
  
  return (
    <div className="relative" ref={datePickerRef}>
      <div 
        className="w-full px-3 py-2 bg-[#1e1e1e]/70 border border-[#333333]/60 text-gray-200 rounded-lg flex items-center justify-between cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedDate ? (
          <div className="flex items-center justify-between w-full">
            <span>{formatDate(selectedDate)}</span>
            {selectedDate && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  clearDate();
                }}
                className="text-gray-400 hover:text-gray-200"
              >
                <X size={16} />
              </button>
            )}
          </div>
        ) : (
          <span className="text-gray-500">Select a date</span>
        )}
        <ChevronDown 
          size={16} 
          className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </div>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="absolute z-20 mt-1 w-full bg-[#252525]/95 backdrop-blur-md border border-[#333333]/70 rounded-lg p-3 shadow-xl"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex justify-between items-center mb-2">
              <button 
                onClick={goToPreviousMonth}
                className="p-1 hover:bg-[#333333] rounded-full"
              >
                <ChevronDown size={16} className="rotate-90" />
              </button>
              <div className="text-sm font-medium">
                {new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </div>
              <button 
                onClick={goToNextMonth}
                className="p-1 hover:bg-[#333333] rounded-full"
              >
                <ChevronDown size={16} className="-rotate-90" />
              </button>
            </div>
            
            <div className="grid grid-cols-7 gap-1 mb-2 text-xs text-center text-gray-500">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day, index) => (
                <div key={day} className="h-6 flex items-center justify-center">
                  {day}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {generateCalendarDays()}
            </div>
            
            <div className="flex justify-between mt-3 pt-2 border-t border-[#333333]/60">
              <button 
                onClick={setToday}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                <Clock size={12} />
                Today
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-xs bg-blue-600/80 hover:bg-blue-700/80 text-white px-2 py-1 rounded-full"
              >
                Done
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Define common card styling for consistent appearance
const cardBaseStyle = "bg-[#18181a]/40 backdrop-blur-xl border border-[#ffffff]/10 shadow-xl hover:shadow-2xl transition-all duration-300";
const cardHoverStyle = "hover:border-[#ffffff]/15";
const activeCardStyle = "border-blue-500/30";
const inputBaseStyle = "bg-[#16161a]/80 border border-[#ffffff]/10 text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500/70 focus:border-blue-500/70";

export default function TaskTankApp() {
  // State to manage which page is active
  const [activePage, setActivePage] = useState<string>("home");
  
  // Apply global styles for scrollbars
  useEffect(() => {
    // Create style element
    const style = document.createElement('style');
    style.innerHTML = globalStyles;
    
    // Add to document head
    document.head.appendChild(style);
    
    // Clean up on unmount
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  return (
    <NavigationContext.Provider value={{ onNavigate: setActivePage, activePage }}>
      <div className="min-h-screen bg-[#121214] text-gray-200 bg-gradient-to-br from-[#121214] to-[#1a1a20]">
        {/* Background elements */}
        <motion.div 
          className="fixed inset-0 -z-10 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5 }}
        >
          <motion.div 
            className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500 rounded-full opacity-5 blur-3xl"
            animate={{ 
              scale: [1, 1.05, 1],
              opacity: [0.05, 0.07, 0.05]
            }}
            transition={{ 
              duration: 8, 
              repeat: Infinity,
              repeatType: "reverse" 
            }}
          />
          <motion.div 
            className="absolute top-1/2 -left-24 w-80 h-80 bg-purple-500 rounded-full opacity-5 blur-3xl"
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.05, 0.08, 0.05]
            }}
            transition={{ 
              duration: 10, 
              repeat: Infinity,
              repeatType: "reverse",
              delay: 1
            }}
          />
        </motion.div>
        
        {/* Navigation */}
        <Navbar onNavigate={setActivePage} activePage={activePage} />
        
        {/* Main Content */}
        <AnimatePresence mode="wait">
          <motion.main 
            key={activePage}
            className="container mx-auto px-4 py-8 relative z-0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activePage === "home" && <HomePage onNavigate={setActivePage} />}
            {activePage === "tasks" && <TaskPage />}
            {activePage === "ideas" && <IdeaPage />}
            {activePage === "notes" && <NotesPage />}
            {activePage === "projects" && <ProjectsPage />}
          </motion.main>
        </AnimatePresence>
        
        {/* Footer - Only show on home page */}
        {activePage === "home" && <Footer />}
      </div>
    </NavigationContext.Provider>
  );
}

// Navigation Component
function Navbar({ onNavigate, activePage }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <motion.nav 
      className="bg-[#18181a]/60 shadow-xl border-b border-[#ffffff]/10 backdrop-blur-xl sticky top-0 z-50"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16 md:justify-center">
          <motion.div 
            className="flex-shrink-0 flex items-center md:absolute md:left-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-400 via-blue-500 to-purple-600 text-transparent bg-clip-text">TaskTank</span>
          </motion.div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-2">
              {[
                { name: "home", icon: <HomeIcon size={18} /> },
                { name: "projects", icon: <FolderKanban size={18} /> },
                { name: "tasks", icon: <CheckSquare size={18} /> },
                { name: "ideas", icon: <Lightbulb size={18} /> },
                { name: "notes", icon: <FileText size={18} /> }
              ].map((item, index) => (
                <motion.button
                  key={item.name}
                  onClick={() => onNavigate(item.name)}
                  className={`px-4 py-2 rounded-full text-sm font-medium capitalize flex items-center gap-2 transition-all duration-200 ${
                    activePage === item.name
                      ? "bg-blue-600/80 text-white shadow-md shadow-blue-900/30 border border-blue-500/30"
                      : "text-gray-300 hover:bg-[#232327]/80 border border-[#ffffff]/5 hover:border-[#ffffff]/10"
                  }`}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {item.icon}
                  {item.name}
                </motion.button>
              ))}
            </div>
          </div>
          <motion.div 
            className="md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <button 
              className="text-gray-300 p-2 rounded-full hover:bg-[#333333]/80 transition-colors"
              onClick={toggleMobileMenu}
              aria-label="Toggle menu"
            >
              <Menu />
            </button>
          </motion.div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              className="md:hidden"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="px-2 pt-2 pb-3 space-y-2 border-t border-[#333333]/70">
                {[
                  { name: "home", icon: <HomeIcon size={18} /> },
                  { name: "projects", icon: <FolderKanban size={18} /> },
                  { name: "tasks", icon: <CheckSquare size={18} /> },
                  { name: "ideas", icon: <Lightbulb size={18} /> },
                  { name: "notes", icon: <FileText size={18} /> }
                ].map((item, index) => (
                  <motion.button
                    key={item.name}
                    onClick={() => {
                      onNavigate(item.name);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full px-4 py-2 rounded-full text-sm font-medium capitalize flex items-center gap-2 transition-all duration-200 ${
                      activePage === item.name
                        ? "bg-blue-600/90 text-white shadow-md shadow-blue-900/20"
                        : "text-gray-300 hover:bg-[#333333]/80"
                    }`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {item.icon}
                    {item.name}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
}

// Home Page Component
function HomePage({ onNavigate }: HomePageProps) {
  return (
    <div className="space-y-8 py-4 mb-12">
      <motion.section 
        className="text-center py-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.h1 
          className="text-4xl md:text-5xl font-bold mb-4 text-white tracking-tight"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Welcome to TaskTank
        </motion.h1>
        <motion.p 
          className="text-xl max-w-2xl mx-auto text-gray-300"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          Your all-in-one productivity hub with modern dark UI and seamless project management
        </motion.p>
      </motion.section>
      
      <motion.section 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        {[
          {
            title: "Tasks",
            description: "Manage tasks with project associations, due dates and detailed information",
            icon: <CheckSquare size={32} className="text-blue-400" />,
            page: "tasks"
          },
          {
            title: "Ideas",
            description: "Capture creative thoughts and easily convert them into actionable tasks",
            icon: <Lightbulb size={32} className="text-yellow-400" />,
            page: "ideas"
          },
          {
            title: "Notes",
            description: "Take and organize notes with categories and date-based grouping",
            icon: <FileText size={32} className="text-green-400" />,
            page: "notes"
          },
          {
            title: "Projects",
            description: "Create color-coded projects to organize related tasks with visual indicators",
            icon: <FolderKanban size={32} className="text-purple-400" />,
            page: "projects"
          }
        ].map((item, index) => (
          <motion.div 
            key={item.title}
            onClick={() => onNavigate(item.page)} 
            className={`${cardBaseStyle} p-6 rounded-xl ${cardHoverStyle} hover:border-blue-500/30`}
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
            whileHover={{ scale: 1.03, y: -5 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="mb-4 bg-[#1e1e1e]/80 p-3 rounded-lg inline-flex">{item.icon}</div>
            <h2 className="text-xl font-bold mb-2 text-white">{item.title}</h2>
            <p className="text-gray-400">{item.description}</p>
          </motion.div>
        ))}
      </motion.section>
      
      <motion.section 
        className={`${cardBaseStyle} p-8 rounded-xl`}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <h2 className="text-2xl font-bold mb-6 text-white text-center">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div 
            className="bg-[#16161a]/60 backdrop-blur-xl border border-[#ffffff]/10 p-6 rounded-xl shadow-lg"
            whileHover={{ scale: 1.02, border: "1px solid rgba(255, 255, 255, 0.15)" }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center mb-4">
              <div className="bg-blue-500/20 p-2 rounded-lg mr-3">
                <FolderKanban size={24} className="text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-blue-400">Project Management</h3>
            </div>
            <ul className="space-y-3">
              <motion.li 
                className="flex items-start"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.7 }}
              >
                <div className="mt-1 mr-2 text-blue-400"><CircleDot size={14} /></div>
                <p className="text-gray-300">Create color-coded projects to organize your work</p>
              </motion.li>
              <motion.li 
                className="flex items-start"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.8 }}
              >
                <div className="mt-1 mr-2 text-blue-400"><CircleDot size={14} /></div>
                <p className="text-gray-300">Filter tasks by project with visual indicators</p>
              </motion.li>
              <motion.li 
                className="flex items-start"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.9 }}
              >
                <div className="mt-1 mr-2 text-blue-400"><CircleDot size={14} /></div>
                <p className="text-gray-300">Automatic task updates when projects change</p>
              </motion.li>
            </ul>
          </motion.div>
          
          <motion.div 
            className="bg-[#16161a]/60 backdrop-blur-xl border border-[#ffffff]/10 p-6 rounded-xl shadow-lg"
            whileHover={{ scale: 1.02, border: "1px solid rgba(255, 255, 255, 0.15)" }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center mb-4">
              <div className="bg-green-500/20 p-2 rounded-lg mr-3">
                <CheckSquare size={24} className="text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-green-400">Task Management</h3>
            </div>
            <ul className="space-y-3">
              <motion.li 
                className="flex items-start"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 1.0 }}
              >
                <div className="mt-1 mr-2 text-green-400"><CircleDot size={14} /></div>
                <p className="text-gray-300">Set due dates with visual countdown indicators</p>
              </motion.li>
              <motion.li 
                className="flex items-start"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 1.1 }}
              >
                <div className="mt-1 mr-2 text-green-400"><CircleDot size={14} /></div>
                <p className="text-gray-300">Add detailed descriptions to tasks</p>
              </motion.li>
              <motion.li 
                className="flex items-start"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 1.2 }}
              >
                <div className="mt-1 mr-2 text-green-400"><CircleDot size={14} /></div>
                <p className="text-gray-300">Track completion status with visual feedback</p>
              </motion.li>
            </ul>
          </motion.div>
        </div>
      </motion.section>
      
      <motion.section 
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
      >
        <motion.div 
          className="bg-[#16161a]/60 backdrop-blur-xl border border-[#ffffff]/10 p-6 rounded-xl shadow-lg"
          whileHover={{ scale: 1.02, border: "1px solid rgba(255, 255, 255, 0.15)" }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center mb-4">
            <div className="bg-yellow-500/20 p-2 rounded-lg mr-3">
              <Lightbulb size={24} className="text-yellow-400" />
            </div>
            <h3 className="text-xl font-bold text-yellow-400">Idea Management</h3>
          </div>
          <p className="text-gray-300 mb-4">
            Capture creative ideas independent from your project system, with the ability to:
          </p>
          <ul className="space-y-3">
            <li className="flex items-start">
              <div className="mt-1 mr-2 text-yellow-400"><CircleDot size={14} /></div>
              <p className="text-gray-400">Store and organize creative thoughts</p>
            </li>
            <li className="flex items-start">
              <div className="mt-1 mr-2 text-yellow-400"><CircleDot size={14} /></div>
              <p className="text-gray-400">Expand ideas to view full details</p>
            </li>
            <li className="flex items-start">
              <div className="mt-1 mr-2 text-yellow-400"><CircleDot size={14} /></div>
              <p className="text-gray-400">Convert ideas to actionable tasks when ready</p>
            </li>
          </ul>
        </motion.div>
        
        <motion.div 
          className="bg-[#16161a]/60 backdrop-blur-xl border border-[#ffffff]/10 p-6 rounded-xl shadow-lg"
          whileHover={{ scale: 1.02, border: "1px solid rgba(255, 255, 255, 0.15)" }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center mb-4">
            <div className="bg-purple-500/20 p-2 rounded-lg mr-3">
              <Layers size={24} className="text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-purple-400">User Experience</h3>
          </div>
          <p className="text-gray-300 mb-4">
            Enjoy a modern, responsive interface with:
          </p>
          <ul className="space-y-3">
            <li className="flex items-start">
              <div className="mt-1 mr-2 text-purple-400"><CircleDot size={14} /></div>
              <p className="text-gray-400">Glass morphism effects for depth</p>
            </li>
            <li className="flex items-start">
              <div className="mt-1 mr-2 text-purple-400"><CircleDot size={14} /></div>
              <p className="text-gray-400">Smooth animations with Framer Motion</p>
            </li>
            <li className="flex items-start">
              <div className="mt-1 mr-2 text-purple-400"><CircleDot size={14} /></div>
              <p className="text-gray-400">Dark theme with vibrant accent colors</p>
            </li>
            <li className="flex items-start">
              <div className="mt-1 mr-2 text-purple-400"><CircleDot size={14} /></div>
              <p className="text-gray-400">Responsive design for all devices</p>
            </li>
          </ul>
        </motion.div>
      </motion.section>
      
      <motion.section 
        className="bg-[#16161a]/60 backdrop-blur-xl border border-[#ffffff]/10 p-8 rounded-xl shadow-lg text-center"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1.0 }}
      >
        <h2 className="text-2xl font-bold mb-4 text-white">Ready to boost your productivity?</h2>
        <p className="text-gray-300 mb-6">Start organizing your work and ideas with TaskTank's powerful features</p>
        <motion.button
          className="bg-blue-600/90 hover:bg-blue-700/90 text-white font-bold py-3 px-8 rounded-lg shadow-lg transition-all duration-300 border border-blue-500/30"
          onClick={() => onNavigate('projects')}
          whileHover={{ scale: 1.05, border: "1px solid rgba(59, 130, 246, 0.5)" }}
          whileTap={{ scale: 0.95 }}
        >
          Get Started
        </motion.button>
      </motion.section>
    </div>
  );
}

// Task Page Component
function TaskPage() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    if (typeof window !== 'undefined') {
      const savedTasks = localStorage.getItem('tasks');
      return savedTasks ? JSON.parse(savedTasks) : [];
    }
    return [];
  });
  const [newTask, setNewTask] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [taskDetails, setTaskDetails] = useState({
    text: "",
    project: "",
    dueDate: "",
    details: ""
  });
  const [activeTaskId, setActiveTaskId] = useState<number | null>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const project = localStorage.getItem('selectedProject');
      return project || null;
    }
    return null;
  });
  const [projects, setProjects] = useState<Project[]>(() => {
    if (typeof window !== 'undefined') {
      const savedProjects = localStorage.getItem('projects');
      return savedProjects ? JSON.parse(savedProjects) : [];
    }
    return [];
  });
  const [showProjectFilter, setShowProjectFilter] = useState(false);
  
  // Save tasks to localStorage whenever tasks change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('tasks', JSON.stringify(tasks));
    }
  }, [tasks]);
  
  // Clear selected project from localStorage when component unmounts
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('selectedProject');
      }
    };
  }, []);
  
  // Extract unique project names from tasks
  const availableProjects = useMemo(() => {
    const projectsFromTasks = tasks
      .map(task => task.project)
      .filter((project): project is string => !!project);
    
    // Get unique project names
    return Array.from(new Set(projectsFromTasks));
  }, [tasks]);
  
  const openAddTaskModal = () => {
    if (newTask.trim() === "") return;
    
    setTaskDetails({
      text: newTask,
      project: selectedProject || "",
      dueDate: "",
      details: ""
    });
    setShowModal(true);
  };
  
  const addTask = () => {
    const task: Task = {
      id: Date.now(),
      text: taskDetails.text,
      completed: false,
      createdAt: new Date().toISOString(),
      dueDate: taskDetails.dueDate || undefined,
      project: taskDetails.project || undefined,
      details: taskDetails.details || undefined
    };
    
    setTasks([...tasks, task]);
    setNewTask("");
    setShowModal(false);
  };
  
  const openViewTaskModal = (id: number) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
      setTaskDetails({
        text: task.text,
        project: task.project || "",
        dueDate: task.dueDate || "",
        details: task.details || ""
      });
      setActiveTaskId(id);
      setShowModal(true);
    }
  };
  
  const updateTask = () => {
    if (!activeTaskId) return;
    
    setTasks(tasks.map(task => 
      task.id === activeTaskId 
      ? {
          ...task,
          text: taskDetails.text,
          dueDate: taskDetails.dueDate || undefined,
          project: taskDetails.project || undefined,
          details: taskDetails.details || undefined
        } 
      : task
    ));
    setShowModal(false);
    setActiveTaskId(null);
  };
  
  const toggleTaskComplete = (id: number) => {
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };
  
  const deleteTask = (id: number) => {
    setTasks(tasks.filter((task) => task.id !== id));
  };
  
  // Filter tasks if a project is selected
  const filteredTasks = selectedProject
    ? tasks.filter(task => task.project === selectedProject)
    : tasks;
  
  // Clear project filter
  const clearProjectFilter = () => {
    setSelectedProject(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('selectedProject');
    }
  };
  
  // Set project filter
  const selectProjectFilter = (projectName: string) => {
    setSelectedProject(projectName);
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedProject', projectName);
    }
    setShowProjectFilter(false);
  };
  
  return (
    <motion.div 
      className="max-w-3xl mx-auto py-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div 
        className="flex items-center justify-between mb-6"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <h1 className="text-3xl font-bold text-white tracking-tight">Tasks</h1>
        
        {/* Project Filter Dropdown */}
        <div className="flex items-center gap-2 relative">
          <div className="text-gray-400 flex items-center gap-2 bg-[#252525]/60 px-3 py-1 rounded-full border border-[#333333]/60 backdrop-blur-sm">
            <Calendar size={16} />
            {new Date().toLocaleDateString()}
          </div>
          
          <div className="relative">
            <motion.button 
              onClick={() => setShowProjectFilter(!showProjectFilter)}
              className={`${
                selectedProject 
                  ? "bg-blue-600/30 text-blue-300 border-blue-500/50" 
                  : "bg-[#252525]/60 text-gray-300 border-[#333333]/60"
              } px-3 py-1 rounded-full border backdrop-blur-sm flex items-center gap-1 transition-all duration-200 hover:bg-[#333333]/80`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FolderKanban size={16} className={selectedProject ? "text-blue-400" : ""} />
              <span className="text-sm max-w-[100px] truncate">
                {selectedProject ? selectedProject : "Filter by project"}
              </span>
              <ChevronDown size={14} className={`transition-transform duration-200 ${showProjectFilter ? "rotate-180" : ""}`} />
            </motion.button>
            
            <AnimatePresence>
              {showProjectFilter && (
                <motion.div 
                  className="absolute right-0 mt-1 bg-[#252525]/95 backdrop-blur-md border border-[#333333]/70 rounded-lg shadow-xl z-10 w-56"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="p-2">
                    <div className="text-sm font-medium text-gray-400 mb-1 px-2 py-1 border-b border-[#333333]/60">
                      Select Project
                    </div>
                    
                    {selectedProject && (
                      <>
                        <button
                          onClick={clearProjectFilter}
                          className="w-full text-left px-2 py-1.5 rounded text-sm hover:bg-[#333333]/70 transition-colors mb-1 flex items-center gap-1 text-gray-300"
                        >
                          <X size={14} />
                          <span>Clear filter</span>
                        </button>
                        <div className="border-t border-[#333333]/40 my-1"></div>
                      </>
                    )}
                    
                    {projects.length > 0 ? (
                      <div className="max-h-60 overflow-y-auto">
                        {projects.map(project => (
                          <button
                            key={project.id}
                            onClick={() => selectProjectFilter(project.name)}
                            className={`w-full text-left px-2 py-1.5 rounded text-sm hover:bg-[#333333]/70 transition-colors flex items-center gap-1 ${
                              selectedProject === project.name ? 'bg-blue-500/20 text-blue-300' : 'text-gray-300'
                            }`}
                          >
                            <div 
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: project.color }}
                            />
                            <span className="truncate flex-1">{project.name}</span>
                            {selectedProject === project.name && <Check size={14} />}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-500 text-sm p-3 text-center flex flex-col items-center gap-2">
                        <FolderKanban size={20} className="text-gray-500/50" />
                        <div>
                          <p>No projects available</p>
                          <p className="text-xs mt-1">Create a project first</p>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
      
      {/* Project Filter Notification */}
      {selectedProject && (
        <motion.div 
          className="bg-[#252525]/70 backdrop-blur-sm border border-[#333333]/70 p-3 rounded-xl mb-6 shadow-lg flex items-center justify-between"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center gap-2">
            <FolderKanban size={16} className="text-blue-400" />
            <span>
              Showing tasks from project: <span className="font-medium text-white">{selectedProject}</span>
            </span>
          </div>
          <button 
            onClick={clearProjectFilter}
            className="text-gray-400 hover:text-gray-200 p-1 rounded-full hover:bg-[#333333]/60 transition-colors"
          >
            <X size={16} />
          </button>
        </motion.div>
      )}
      
      {/* Add Task Form */}
      <motion.div 
        className="bg-[#252525]/70 backdrop-blur-sm border border-[#333333]/70 p-5 rounded-xl mb-6 shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <div className="flex">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && openAddTaskModal()}
            placeholder="Add a new task..."
            className="flex-grow px-4 py-3 bg-[#1e1e1e]/80 border border-[#333333]/60 text-gray-200 rounded-l-full focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-500"
          />
          <motion.button
            onClick={openAddTaskModal}
            className="bg-blue-600/90 hover:bg-blue-700/90 text-white px-5 py-3 rounded-r-full flex items-center gap-1 transition-colors shadow-md backdrop-blur-sm"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus size={18} />
            Add
          </motion.button>
        </div>
      </motion.div>
      
      {/* Task List */}
      <div className="space-y-3">
        <AnimatePresence>
          {filteredTasks.length === 0 ? (
            <motion.div 
              className="text-center py-12 bg-[#252525]/70 backdrop-blur-sm border border-[#333333]/70 rounded-xl shadow-lg"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <CheckSquare size={48} className="text-gray-600 mx-auto mb-4" />
              <p className="text-lg text-gray-400">
                {selectedProject 
                  ? `No tasks in project "${selectedProject}"`
                  : "No tasks yet"
                }
              </p>
              <p className="text-sm text-gray-500">
                {selectedProject 
                  ? "Add your first task to this project using the form above"
                  : "Add your first task using the form above"
                }
              </p>
            </motion.div>
          ) : (
            filteredTasks.map((task, index) => (
              <motion.div
                key={task.id}
                className="flex items-center p-4 bg-[#252525]/70 backdrop-blur-sm border border-[#333333]/70 rounded-xl group hover:border-blue-500/70 transition-all duration-200 shadow-md hover:shadow-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
                exit={{ opacity: 0, scale: 0.9 }}
                layout
              >
                <motion.button
                  onClick={() => toggleTaskComplete(task.id)}
                  className={`h-6 w-6 rounded-full flex items-center justify-center mr-3 transition-colors ${
                    task.completed ? "bg-blue-500/90 text-white" : "border border-gray-500/80 text-transparent hover:border-blue-500/80"
                  }`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {task.completed && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring" }}
                    >
                      <Check size={14} />
                    </motion.div>
                  )}
                </motion.button>
                
                <div className="flex-grow">
                  <div className={`${task.completed ? "line-through text-gray-500" : "text-gray-200"}`}>
                    {task.text}
                  </div>
                  
                  {(task.project || task.dueDate) && (
                    <div className="flex flex-wrap gap-2 mt-1 text-xs">
                      {task.project && (
                        <ProjectTag 
                          projectName={task.project} 
                          projects={projects} 
                          onClick={() => selectProjectFilter(task.project as string)}
                        />
                      )}
                      {task.dueDate && (
                        <span className="bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Calendar size={10} />
                          {formatDate(task.dueDate)}
                          <span className="ml-1 bg-orange-500/30 px-1 rounded-full">
                            {daysRemaining(task.dueDate)}
                          </span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-1">
                  <motion.button
                    onClick={() => openViewTaskModal(task.id)}
                    className="text-gray-500 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-[#333333]/60 flex items-center gap-1"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <FileText size={16} />
                  </motion.button>
                  <motion.button
                    onClick={() => deleteTask(task.id)}
                    className="text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-[#333333]/60"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Trash2 size={16} />
                  </motion.button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
      
      {/* Task Details Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setShowModal(false);
              setActiveTaskId(null);
            }}
          >
            <motion.div 
              className="bg-[#252525]/80 backdrop-blur-md border border-[#333333]/70 rounded-2xl p-6 w-full sm:w-[90%] md:w-[70%] lg:w-[60%] xl:w-[50%] max-w-2xl shadow-2xl max-h-[85vh] overflow-y-auto"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                {activeTaskId ? <FileText size={20} className="text-blue-400" /> : <Plus size={20} className="text-blue-400" />}
                {activeTaskId ? 'Task Details' : 'New Task Details'}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-5 md:col-span-1">
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                  >
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Task
                    </label>
                    <input
                      type="text"
                      value={taskDetails.text}
                      onChange={(e) => setTaskDetails({...taskDetails, text: e.target.value})}
                      className="w-full px-3 py-2 bg-[#1e1e1e]/70 border border-[#333333]/60 text-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                      maxLength={150}
                    />
                  </motion.div>
                  
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-1">
                      <Calendar size={14} />
                      Due Date
                    </label>
                    <DatePicker 
                      value={taskDetails.dueDate}
                      onChange={(date) => setTaskDetails({...taskDetails, dueDate: date})}
                    />
                  </motion.div>
                  
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                  >
                    <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-1">
                      <FolderKanban size={14} />
                      Project
                    </label>
                    <select
                      value={taskDetails.project}
                      onChange={(e) => setTaskDetails({...taskDetails, project: e.target.value})}
                      className="w-full px-3 py-2 bg-[#1e1e1e]/70 border border-[#333333]/60 text-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none cursor-pointer"
                    >
                      <option value="">No Project</option>
                      {projects.map(project => (
                        <option 
                          key={project.id} 
                          value={project.name}
                          style={{ backgroundColor: '#1e1e1e' }}
                        >
                          {project.name}
                        </option>
                      ))}
                    </select>
                    
                    {/* Custom project selector with colors - shown after the hidden native select element */}
                    {taskDetails.project && (
                      <div className="flex items-center gap-2 mt-2 px-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ 
                            backgroundColor: projects.find(p => p.name === taskDetails.project)?.color || '#3B82F6' 
                          }}
                        />
                        <span className="text-sm text-gray-400">
                          Selected project: <span className="text-white">{taskDetails.project}</span>
                        </span>
                      </div>
                    )}
                  </motion.div>
                </div>
                
                <div className="md:col-span-1 flex flex-col">
                  {activeTaskId && (
                    <motion.div 
                      className="mb-5 bg-[#1e1e1e]/40 p-4 rounded-xl border border-[#333333]/60"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <div className="flex flex-wrap gap-2">
                        {taskDetails.project && (
                          <ProjectTag 
                            projectName={taskDetails.project} 
                            projects={projects}
                            size="md" 
                          />
                        )}
                        {taskDetails.dueDate && (
                          <span className="bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded-full text-xs flex items-center gap-1">
                            <Calendar size={12} />
                            {formatDate(taskDetails.dueDate)}
                            <span className="ml-1 bg-orange-500/30 px-1 rounded-full">
                              {daysRemaining(taskDetails.dueDate)}
                            </span>
                          </span>
                        )}
                        <span className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full text-xs flex items-center gap-1">
                          <Clock size={12} />
                          Created: {formatDate(tasks.find(t => t.id === activeTaskId)?.createdAt)}
                        </span>
                      </div>
                    </motion.div>
                  )}
                  
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex-grow flex flex-col"
                  >
                    <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-1">
                      <FileText size={14} />
                      Additional Details
                    </label>
                    <textarea
                      value={taskDetails.details}
                      onChange={(e) => setTaskDetails({...taskDetails, details: e.target.value})}
                      className="w-full px-3 py-2 bg-[#1e1e1e]/70 border border-[#333333]/60 text-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 min-h-[120px] flex-grow overflow-y-auto custom-scrollbar resize-none"
                      maxLength={2000}
                    />
                  </motion.div>
                </div>
              </div>
              
              <motion.div 
                className="flex justify-end gap-3 mt-8 pt-4 border-t border-[#333333]/60"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
              >
                <motion.button
                  onClick={() => {
                    setShowModal(false);
                    setActiveTaskId(null);
                  }}
                  className="px-5 py-2 border border-[#333333]/70 text-gray-300 rounded-full hover:bg-[#333333]/60 transition-colors min-w-[100px]"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={activeTaskId ? updateTask : addTask}
                  className="px-5 py-2 bg-blue-600/90 text-white rounded-full hover:bg-blue-700/90 transition-colors shadow-md backdrop-blur-sm min-w-[100px]"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {activeTaskId ? 'Update' : 'Add Task'}
                </motion.button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Idea Page Component
function IdeaPage() {
  const [ideas, setIdeas] = useState<Idea[]>(() => {
    if (typeof window !== 'undefined') {
      const savedIdeas = localStorage.getItem('ideas');
      return savedIdeas ? JSON.parse(savedIdeas) : [];
    }
    return [];
  });
  const [newIdea, setNewIdea] = useState("");
  const [newIdeaTitle, setNewIdeaTitle] = useState("");
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [convertTaskDetails, setConvertTaskDetails] = useState({
    text: "",
    project: "",
    dueDate: "",
    details: ""
  });
  const [expandedIdeas, setExpandedIdeas] = useState<number[]>([]);
  
  // Save ideas to localStorage whenever ideas change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ideas', JSON.stringify(ideas));
    }
  }, [ideas]);
  
  const addIdea = () => {
    if (newIdea.trim() === "" || newIdeaTitle.trim() === "") return;
    
    const idea: Idea = {
      id: Date.now(),
      title: newIdeaTitle,
      text: newIdea,
      createdAt: new Date().toISOString()
    };
    
    setIdeas([...ideas, idea]);
    setNewIdea("");
    setNewIdeaTitle("");
  };
  
  const deleteIdea = (id: number) => {
    setIdeas(ideas.filter((idea) => idea.id !== id));
  };

  const toggleExpandIdea = (id: number) => {
    setExpandedIdeas(prev => 
      prev.includes(id) 
        ? prev.filter(ideaId => ideaId !== id) 
        : [...prev, id]
    );
  };

  const openConvertModal = (idea: Idea) => {
    setSelectedIdea(idea);
    setConvertTaskDetails({
      text: idea.title,
      project: "",
      dueDate: "",
      details: idea.text + `\n\nConverted from idea created on ${formatDate(idea.createdAt)}`
    });
    setShowConvertModal(true);
  };

  const convertToTask = () => {
    if (!selectedIdea) return;
    
    // Get existing tasks from localStorage
    let tasks: Task[] = [];
    if (typeof window !== 'undefined') {
      const savedTasks = localStorage.getItem('tasks');
      tasks = savedTasks ? JSON.parse(savedTasks) : [];
    }
    
    // Create new task from idea
    const newTask: Task = {
      id: Date.now(),
      text: convertTaskDetails.text,
      completed: false,
      createdAt: new Date().toISOString(),
      dueDate: convertTaskDetails.dueDate || undefined,
      project: convertTaskDetails.project || undefined,
      details: convertTaskDetails.details || undefined
    };
    
    // Save updated tasks to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('tasks', JSON.stringify([...tasks, newTask]));
    }
    
    // Optionally remove the idea after conversion
    deleteIdea(selectedIdea.id);
    
    // Close modal
    setShowConvertModal(false);
    setSelectedIdea(null);
  };

  // Function to truncate text
  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };
  
  return (
    <motion.div 
      className="max-w-3xl mx-auto py-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.h1 
        className="text-3xl font-bold mb-6 text-white tracking-tight"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        Ideas
      </motion.h1>
      
      {/* Add Idea Form */}
      <motion.div 
        className="bg-[#252525]/70 backdrop-blur-sm border border-[#333333]/70 p-5 rounded-xl mb-6 shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <input
          type="text"
          value={newIdeaTitle}
          onChange={(e) => setNewIdeaTitle(e.target.value)}
          placeholder="Idea title..."
          className="w-full px-4 py-3 bg-[#1e1e1e]/80 border border-[#333333]/60 text-gray-200 rounded-t-xl focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-500 mb-1"
          maxLength={100}
        />
        <textarea
          value={newIdea}
          onChange={(e) => setNewIdea(e.target.value)}
          placeholder="Describe your idea in detail..."
          className="w-full px-4 py-3 bg-[#1e1e1e]/80 border border-[#333333]/60 text-gray-200 rounded-b-xl focus:outline-none focus:ring-1 focus:ring-blue-500 min-h-[120px] placeholder-gray-500"
          maxLength={2000}
        />
        <motion.button
          onClick={addIdea}
          className="mt-3 bg-blue-600/90 hover:bg-blue-700/90 text-white px-5 py-2 rounded-full flex items-center gap-1 w-fit transition-colors shadow-md backdrop-blur-sm"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Plus size={18} />
          Save Idea
        </motion.button>
      </motion.div>
      
      {/* Idea List */}
      <div className="space-y-4">
        <AnimatePresence>
          {ideas.length === 0 ? (
            <motion.div 
              className="text-center py-12 bg-[#252525]/70 backdrop-blur-sm border border-[#333333]/70 rounded-xl shadow-lg"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <Lightbulb size={48} className="text-gray-600 mx-auto mb-4" />
              <p className="text-lg text-gray-400">Your idea inbox is empty</p>
              <p className="text-sm text-gray-500">Start braindumping your ideas using the form above</p>
            </motion.div>
          ) : (
            ideas.map((idea, index) => (
              <motion.div
                key={idea.id}
                className="p-5 bg-[#252525]/70 backdrop-blur-sm border border-[#333333]/70 rounded-xl group hover:border-blue-500/70 transition-all duration-200 shadow-md hover:shadow-lg max-w-full"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
                exit={{ opacity: 0, scale: 0.9 }}
                layout
              >
                <div className="flex justify-between mb-3">
                  <span className="text-sm text-gray-500 flex items-center gap-1 bg-[#1e1e1e]/80 px-2 py-1 rounded-full">
                    <Calendar size={14} />
                    {formatDate(idea.createdAt)}
                  </span>
                  <div className="flex gap-2">
                    <motion.button
                      onClick={() => openConvertModal(idea)}
                      className="text-gray-500 hover:text-green-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-[#333333]/60 flex items-center gap-1"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      title="Convert to Task"
                    >
                      <CheckSquare size={16} />
                    </motion.button>
                    <motion.button
                      onClick={() => deleteIdea(idea.id)}
                      className="text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-[#333333]/60"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Trash2 size={16} />
                    </motion.button>
                  </div>
                </div>
                
                {/* Idea Title */}
                <h3 className="text-lg font-semibold text-white mb-2 break-words overflow-hidden">{idea.title}</h3>
                
                {/* Idea Content with Read More toggle */}
                <div className="text-gray-300">
                  {expandedIdeas.includes(idea.id) ? (
                    <p className="whitespace-pre-wrap break-words overflow-hidden">{idea.text}</p>
                  ) : (
                    <p className="whitespace-pre-wrap break-words overflow-hidden">{truncateText(idea.text)}</p>
                  )}
                  
                  {idea.text.length > 150 && (
                    <button 
                      onClick={() => toggleExpandIdea(idea.id)}
                      className="text-blue-400 hover:text-blue-300 text-sm mt-2 transition-colors focus:outline-none"
                    >
                      {expandedIdeas.includes(idea.id) ? 'Show less' : 'Read more'}
                    </button>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Convert to Task Modal */}
      <AnimatePresence>
        {showConvertModal && selectedIdea && (
          <motion.div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowConvertModal(false)}
          >
            <motion.div 
              className="bg-[#252525]/80 backdrop-blur-md border border-[#333333]/70 rounded-2xl p-6 w-full sm:w-[90%] md:w-[70%] lg:w-[60%] xl:w-[50%] max-w-2xl shadow-2xl max-h-[85vh] overflow-y-auto"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <CheckSquare size={20} className="text-green-400" />
                Convert Idea to Task
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-5 md:col-span-1">
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                  >
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Task
                    </label>
                    <input
                      type="text"
                      value={convertTaskDetails.text}
                      onChange={(e) => setConvertTaskDetails({...convertTaskDetails, text: e.target.value})}
                      className="w-full px-3 py-2 bg-[#1e1e1e]/70 border border-[#333333]/60 text-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                      maxLength={150}
                    />
                  </motion.div>
                  
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-1">
                      <Calendar size={14} />
                      Due Date
                    </label>
                    <DatePicker 
                      value={convertTaskDetails.dueDate}
                      onChange={(date) => setConvertTaskDetails({...convertTaskDetails, dueDate: date})}
                    />
                  </motion.div>
                  
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                  >
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Project
                    </label>
                    <input
                      type="text"
                      value={convertTaskDetails.project}
                      onChange={(e) => setConvertTaskDetails({...convertTaskDetails, project: e.target.value})}
                      placeholder="Optional"
                      className="w-full px-3 py-2 bg-[#1e1e1e]/70 border border-[#333333]/60 text-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                      maxLength={50}
                    />
                  </motion.div>
                </div>
                
                <div className="md:col-span-1 flex flex-col">
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex-grow flex flex-col"
                  >
                    <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-1">
                      <FileText size={14} />
                      Additional Details
                    </label>
                    <textarea
                      value={convertTaskDetails.details}
                      onChange={(e) => setConvertTaskDetails({...convertTaskDetails, details: e.target.value})}
                      className="w-full px-3 py-2 bg-[#1e1e1e]/70 border border-[#333333]/60 text-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 min-h-[160px] flex-grow overflow-y-auto custom-scrollbar resize-none"
                      maxLength={2000}
                    />
                  </motion.div>
                </div>
              </div>
              
              <motion.div 
                className="flex justify-end gap-3 mt-8 pt-4 border-t border-[#333333]/60"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
              >
                <motion.button
                  onClick={() => setShowConvertModal(false)}
                  className="px-5 py-2 border border-[#333333]/70 text-gray-300 rounded-full hover:bg-[#333333]/60 transition-colors min-w-[100px]"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={convertToTask}
                  className="px-5 py-2 bg-green-600/90 hover:bg-green-700/90 text-white rounded-full flex items-center justify-center gap-1 transition-colors shadow-md backdrop-blur-sm min-w-[140px]"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <CheckSquare size={16} />
                  Convert to Task
                </motion.button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Notes Page Component
function NotesPage() {
  const [notes, setNotes] = useState<Note[]>(() => {
    if (typeof window !== 'undefined') {
      const savedNotes = localStorage.getItem('notes');
      return savedNotes ? JSON.parse(savedNotes) : [];
    }
    return [];
  });
  const [newNote, setNewNote] = useState("");
  const [showAddNote, setShowAddNote] = useState(false);
  
  // Save notes to localStorage whenever notes change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('notes', JSON.stringify(notes));
    }
  }, [notes]);
  
  const addNote = () => {
    if (newNote.trim() === "") return;
    
    const note: Note = {
      id: Date.now(),
      text: newNote,
      createdAt: new Date().toISOString()
    };
    
    setNotes([...notes, note]);
    setNewNote("");
    setShowAddNote(false);
  };
  
  const deleteNote = (id: number) => {
    setNotes(notes.filter((note) => note.id !== id));
  };
  
  // Group notes by date for timeline display
  const groupNotesByDate = () => {
    const groups: {[key: string]: Note[]} = {};
    
    notes.forEach(note => {
      const date = new Date(note.createdAt);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      // Format the date as a key
      let dateKey;
      if (date.toDateString() === today.toDateString()) {
        dateKey = "Today";
      } else if (date.toDateString() === yesterday.toDateString()) {
        dateKey = "Yesterday";
      } else {
        dateKey = date.toLocaleDateString('en-US', { 
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        });
      }
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      
      groups[dateKey].push(note);
    });
    
    // Sort notes within each group by time (newest first)
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    });
    
    return groups;
  };
  
  const groupedNotes = groupNotesByDate();
  // Sort date keys (Today, Yesterday, then dates in descending order)
  const sortedDateKeys = Object.keys(groupedNotes).sort((a, b) => {
    if (a === "Today") return -1;
    if (b === "Today") return 1;
    if (a === "Yesterday") return -1;
    if (b === "Yesterday") return 1;
    
    return new Date(b).getTime() - new Date(a).getTime();
  });
  
  return (
    <motion.div 
      className="max-w-3xl mx-auto py-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-6">
        <motion.h1 
          className="text-3xl font-bold text-white tracking-tight"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          Notes
        </motion.h1>
        
        <motion.button
          onClick={() => setShowAddNote(true)}
          className="bg-blue-600/90 hover:bg-blue-700/90 text-white p-2 rounded-full flex items-center justify-center shadow-md"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Plus size={20} />
        </motion.button>
      </div>
      
      {/* Notes Timeline */}
      <div className="relative pl-10 pb-8">
        {/* Timeline Line */}
        <div className="absolute left-3 top-3 bottom-0 w-0.5 bg-gray-700/50"></div>
        
        {notes.length === 0 ? (
          <motion.div 
            className="text-center py-12 bg-[#252525]/70 backdrop-blur-sm border border-[#333333]/70 rounded-xl shadow-lg mb-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <FileText size={48} className="text-gray-600 mx-auto mb-4" />
            <p className="text-xl text-gray-400 mb-2">No notes yet</p>
            <p className="text-gray-500 max-w-md mx-auto">
              Start by adding your first note
            </p>
            <motion.button
              onClick={() => setShowAddNote(true)}
              className="mt-6 bg-blue-600/90 hover:bg-blue-700/90 text-white px-4 py-2 rounded-full flex items-center gap-2 mx-auto"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus size={18} />
              Add First Note
            </motion.button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {sortedDateKeys.map((dateKey, dateIndex) => (
                <div key={dateKey} className="mb-8">
                  {/* Date Header with Circle */}
                  <div className="flex items-center mb-4 -ml-10 relative">
                    <motion.div 
                      className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center z-10"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.3, delay: 0.1 + dateIndex * 0.05 }}
                    >
                      {dateKey === "Today" ? (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      ) : (
                        <div className="w-2 h-2 bg-blue-200 rounded-full"></div>
                      )}
                    </motion.div>
                    <motion.h3 
                      className="text-lg font-medium text-gray-300 ml-4"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.2 + dateIndex * 0.05 }}
                    >
                      {dateKey}
                    </motion.h3>
                  </div>
                  
                  {/* Notes for this date */}
                  <div className="space-y-3 ml-2">
                    <AnimatePresence>
                      {groupedNotes[dateKey].map((note, noteIndex) => (
                        <motion.div
                          key={note.id}
                          className="p-4 bg-[#1e1e1e]/90 border border-[#333333]/70 rounded-xl hover:border-blue-500/30 transition-all duration-200 shadow-md group"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: 0.1 + noteIndex * 0.03 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          layout
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs text-gray-500 py-0.5 rounded-full">
                              {new Date(note.createdAt).toLocaleTimeString('en-US', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                            <motion.button
                              onClick={() => deleteNote(note.id)}
                              className="text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <Trash2 size={16} />
                            </motion.button>
                          </div>
                          <p className="text-gray-300 whitespace-pre-wrap break-words">{note.text}</p>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
      
      {/* Add Note Modal */}
      <AnimatePresence>
        {showAddNote && (
          <motion.div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAddNote(false)}
          >
            <motion.div 
              className="bg-[#252525]/80 backdrop-blur-md border border-[#333333]/70 rounded-2xl p-6 w-full sm:w-[90%] md:w-[60%] lg:w-[50%] max-w-lg shadow-2xl"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <FileText size={20} className="text-blue-400" />
                Add New Note
              </h3>
              
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full px-4 py-3 bg-[#1e1e1e]/80 border border-[#333333]/60 text-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 min-h-[180px] overflow-y-auto custom-scrollbar resize-none"
                autoFocus
              />
              
              <div className="flex justify-end gap-3 mt-6">
                <motion.button
                  onClick={() => setShowAddNote(false)}
                  className="px-4 py-2 border border-[#333333]/70 text-gray-300 rounded-full hover:bg-[#333333]/60 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={addNote}
                  className="px-4 py-2 bg-blue-600/90 text-white rounded-full hover:bg-blue-700/90 transition-colors shadow-md backdrop-blur-sm"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Save Note
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Projects Page Component
function ProjectsPage() {
  const { onNavigate } = useContext(NavigationContext);
  
  const [projects, setProjects] = useState<Project[]>(() => {
    if (typeof window !== 'undefined') {
      const savedProjects = localStorage.getItem('projects');
      return savedProjects ? JSON.parse(savedProjects) : [];
    }
    return [];
  });
  const [showModal, setShowModal] = useState(false);
  const [projectDetails, setProjectDetails] = useState({
    name: "",
    description: "",
    color: "#3B82F6" // Default blue color
  });
  const [activeProjectId, setActiveProjectId] = useState<number | null>(null);
  const [tasks, setTasks] = useState<Task[]>(() => {
    if (typeof window !== 'undefined') {
      const savedTasks = localStorage.getItem('tasks');
      return savedTasks ? JSON.parse(savedTasks) : [];
    }
    return [];
  });
  
  // Project colors selection
  const projectColors = [
    { name: "Blue", value: "#3B82F6" },
    { name: "Purple", value: "#8B5CF6" },
    { name: "Pink", value: "#EC4899" },
    { name: "Orange", value: "#F97316" },
    { name: "Green", value: "#10B981" },
    { name: "Teal", value: "#14B8A6" },
    { name: "Red", value: "#EF4444" },
    { name: "Amber", value: "#F59E0B" }
  ];
  
  // Save projects to localStorage whenever projects change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('projects', JSON.stringify(projects));
    }
  }, [projects]);
  
  // Count tasks for each project
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Count tasks for each project
      const updatedProjects = projects.map(project => {
        const taskCount = tasks.filter(task => task.project === project.name).length;
        return { ...project, taskCount };
      });
      
      // Only update if the counts have changed
      if (JSON.stringify(updatedProjects) !== JSON.stringify(projects)) {
        setProjects(updatedProjects);
      }
    }
  }, [projects, tasks]);
  
  const openAddProjectModal = () => {
    setProjectDetails({
      name: "",
      description: "",
      color: "#3B82F6"
    });
    setActiveProjectId(null);
    setShowModal(true);
  };
  
  const openEditProjectModal = (project: Project) => {
    setProjectDetails({
      name: project.name,
      description: project.description,
      color: project.color
    });
    setActiveProjectId(project.id);
    setShowModal(true);
  };
  
  const addProject = () => {
    if (projectDetails.name.trim() === "") return;
    
    // Check if project name already exists
    if (projects.some(p => p.name.toLowerCase() === projectDetails.name.toLowerCase())) {
      alert("A project with this name already exists. Please use a different name.");
      return;
    }
    
    const newProject: Project = {
      id: Date.now(),
      name: projectDetails.name,
      description: projectDetails.description,
      createdAt: new Date().toISOString(),
      color: projectDetails.color,
      taskCount: 0
    };
    
    setProjects([...projects, newProject]);
    setShowModal(false);
  };
  
  const updateProject = () => {
    if (!activeProjectId || projectDetails.name.trim() === "") return;
    
    // Check if the updated name conflicts with another project (excluding the current one)
    const nameExists = projects.some(
      p => p.id !== activeProjectId && p.name.toLowerCase() === projectDetails.name.toLowerCase()
    );
    
    if (nameExists) {
      alert("A project with this name already exists. Please use a different name.");
      return;
    }
    
    // Get the old project name before updating
    const oldProject = projects.find(p => p.id === activeProjectId);
    const oldProjectName = oldProject?.name;
    
    // Update the project
    setProjects(projects.map(project => 
      project.id === activeProjectId 
      ? {
          ...project,
          name: projectDetails.name,
          description: projectDetails.description,
          color: projectDetails.color
        } 
      : project
    ));
    
    // If project name changed, update all tasks with this project
    if (oldProjectName && oldProjectName !== projectDetails.name) {
      const updatedTasks = tasks.map(task => 
        task.project === oldProjectName
          ? { ...task, project: projectDetails.name }
          : task
      );
      
      setTasks(updatedTasks);
      
      // Update localStorage for tasks
      if (typeof window !== 'undefined') {
        localStorage.setItem('tasks', JSON.stringify(updatedTasks));
      }
    }
    
    setShowModal(false);
    setActiveProjectId(null);
  };
  
  const deleteProject = (id: number) => {
    // Get the project name before deleting
    const projectToDelete = projects.find(p => p.id === id);
    
    if (projectToDelete) {
      // Ask for confirmation, especially if there are tasks in this project
      if (projectToDelete.taskCount > 0) {
        const confirmDelete = confirm(
          `This project has ${projectToDelete.taskCount} task${projectToDelete.taskCount === 1 ? '' : 's'}. ` +
          `Do you want to delete the project and remove the project association from these tasks?`
        );
        
        if (!confirmDelete) return;
        
        // Remove the project association from tasks
        const updatedTasks = tasks.map(task => 
          task.project === projectToDelete.name
            ? { ...task, project: undefined }
            : task
        );
        
        setTasks(updatedTasks);
        
        // Update localStorage for tasks
        if (typeof window !== 'undefined') {
          localStorage.setItem('tasks', JSON.stringify(updatedTasks));
        }
      }
      
      // Delete the project
      setProjects(projects.filter(project => project.id !== id));
    }
  };
  
  // Function to view tasks associated with a project
  const viewProjectTasks = (projectName: string) => {
    // Store the selected project name to filter tasks
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedProject', projectName);
    }
    
    // Navigate to tasks page
    onNavigate("tasks");
  };
  
  return (
    <motion.div 
      className="max-w-5xl mx-auto py-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-6">
        <motion.h1 
          className="text-3xl font-bold text-white tracking-tight"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          Projects
        </motion.h1>
        
        <motion.button
          onClick={openAddProjectModal}
          className="bg-blue-600/90 hover:bg-blue-700/90 text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-md"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Plus size={18} />
          New Project
        </motion.button>
      </div>
      
      {projects.length === 0 ? (
        <motion.div 
          className="text-center py-16 bg-[#252525]/70 backdrop-blur-sm border border-[#333333]/70 rounded-xl shadow-lg"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <FolderKanban size={64} className="text-gray-600 mx-auto mb-4" />
          <p className="text-xl text-gray-400 mb-2">No projects yet</p>
          <p className="text-gray-500 max-w-md mx-auto">
            Create projects to organize your tasks and track your progress more effectively.
          </p>
          <motion.button
            onClick={openAddProjectModal}
            className="mt-6 bg-blue-600/90 hover:bg-blue-700/90 text-white px-4 py-2 rounded-full flex items-center gap-2 mx-auto"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus size={18} />
            Create First Project
          </motion.button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence>
            {projects.map((project, index) => (
              <motion.div
                key={project.id}
                className="bg-[#252525]/70 backdrop-blur-sm border border-[#333333]/70 rounded-xl overflow-hidden shadow-lg group hover:shadow-xl transition-all duration-300"
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.1 + index * 0.05 }}
                exit={{ opacity: 0, scale: 0.9 }}
                layout
                style={{ borderTopColor: project.color, borderTopWidth: '4px' }}
              >
                <div className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-white">{project.name}</h3>
                    <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <motion.button
                        onClick={() => openEditProjectModal(project)}
                        className="p-1 text-gray-400 hover:text-blue-400 rounded-full"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
                        </svg>
                      </motion.button>
                      <motion.button
                        onClick={() => deleteProject(project.id)}
                        className="p-1 text-gray-400 hover:text-red-400 rounded-full"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Trash2 size={16} />
                      </motion.button>
                    </div>
                  </div>
                  
                  <div className="mt-1 mb-3">
                    <p className="text-gray-400 text-sm">{project.description || "No description"}</p>
                    <div className="flex items-center mt-2 text-xs text-gray-500">
                      <Clock size={12} className="mr-1" />
                      <span>Created {formatDate(project.createdAt)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-1 text-gray-300">
                      <CheckSquare size={16} />
                      <span>{project.taskCount} {project.taskCount === 1 ? 'task' : 'tasks'}</span>
                    </div>
                    
                    <motion.button
                      onClick={() => viewProjectTasks(project.name)}
                      className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
                      whileHover={{ x: 3 }}
                    >
                      View Tasks
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m9 18 6-6-6-6"></path>
                      </svg>
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
      
      {/* Project Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowModal(false)}
          >
            <motion.div 
              className="bg-[#252525]/80 backdrop-blur-md border border-[#333333]/70 rounded-2xl p-6 w-full sm:w-[90%] md:w-[60%] lg:w-[50%] max-w-lg shadow-2xl"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              style={{ borderTopColor: projectDetails.color, borderTopWidth: '4px' }}
            >
              <h3 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
                <FolderKanban size={20} style={{ color: projectDetails.color }} />
                {activeProjectId ? 'Edit Project' : 'New Project'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={projectDetails.name}
                    onChange={(e) => setProjectDetails({...projectDetails, name: e.target.value})}
                    placeholder="Enter project name"
                    className="w-full px-3 py-2 bg-[#1e1e1e]/70 border border-[#333333]/60 text-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    maxLength={50}
                    autoFocus
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Description
                  </label>
                  <textarea
                    value={projectDetails.description}
                    onChange={(e) => setProjectDetails({...projectDetails, description: e.target.value})}
                    placeholder="Optional project description"
                    className="w-full px-3 py-2 bg-[#1e1e1e]/70 border border-[#333333]/60 text-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 min-h-[80px] overflow-y-auto custom-scrollbar resize-none"
                    maxLength={200}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Project Color
                  </label>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                    {projectColors.map(color => (
                      <motion.button
                        key={color.value}
                        onClick={() => setProjectDetails({...projectDetails, color: color.value})}
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          projectDetails.color === color.value ? 'ring-2 ring-white ring-offset-1 ring-offset-[#252525]' : ''
                        }`}
                        style={{ backgroundColor: color.value }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        aria-label={`Select ${color.name} color`}
                      >
                        {projectDetails.color === color.value && (
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 6 9 17l-5-5"></path>
                          </svg>
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[#333333]/60">
                <motion.button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-[#333333]/70 text-gray-300 rounded-full hover:bg-[#333333]/60 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={activeProjectId ? updateProject : addProject}
                  className="px-4 py-2 text-white rounded-full shadow-md backdrop-blur-sm"
                  style={{ backgroundColor: `${projectDetails.color}CC` }}
                  whileHover={{ scale: 1.05, backgroundColor: projectDetails.color }}
                  whileTap={{ scale: 0.95 }}
                >
                  {activeProjectId ? 'Update Project' : 'Create Project'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Footer Component
function Footer() {
  return (
    <motion.footer 
      className="bg-[#252525]/80 backdrop-blur-md border-t border-[#333333]/70 py-6 mt-12 relative z-10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.8 }}
    >
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 1 }}
            className="mb-4 md:mb-0"
          >
            <span className="text-lg font-bold text-blue-400 tracking-tight">TaskTank</span>
            <p className="text-sm text-gray-500 mt-1">
              &copy; {new Date().getFullYear()} All rights reserved.
            </p>
          </motion.div>
          
          <motion.div 
            className="flex space-x-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.1 }}
          >
            {[
              { icon: <HomeIcon size={16} />, label: "Home" },
              { icon: <CheckSquare size={16} />, label: "Tasks" },
              { icon: <Lightbulb size={16} />, label: "Ideas" },
              { icon: <FileText size={16} />, label: "Notes" }
            ].map((item, index) => (
              <motion.div 
                key={item.label}
                className="text-gray-500 hover:text-gray-300 transition-colors flex flex-col items-center text-xs"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 1.2 + index * 0.1 }}
                whileHover={{ scale: 1.1, y: -2 }}
              >
                {item.icon}
                <span className="mt-1">{item.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
    </div>
    </motion.footer>
  );
}

// ProjectTag component for consistent project display
function ProjectTag({ 
  projectName, 
  projects, 
  onClick = undefined,
  size = "sm"
}: { 
  projectName: string, 
  projects: Project[], 
  onClick?: () => void,
  size?: "sm" | "md"
}) {
  const project = projects.find(p => p.name === projectName);
  const color = project?.color || '#d8b4fe';
  const bgColor = `${color}20`; // 20% opacity version of the color
  
  return (
    <span 
      className={`${size === "md" ? "px-3 py-1" : "px-2 py-0.5"} rounded-full flex items-center gap-1 ${onClick ? "cursor-pointer" : ""}`}
      style={{
        backgroundColor: bgColor,
        color: color
      }}
      onClick={onClick}
    >
      <div 
        className={`${size === "md" ? "w-2.5 h-2.5" : "w-2 h-2"} rounded-full`}
        style={{ backgroundColor: color }}
      />
      {projectName}
    </span>
  );
}