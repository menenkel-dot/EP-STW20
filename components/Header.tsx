// ... (vorheriger Code bleibt gleich)

const Header: React.FC<HeaderProps> = ({ notifications, markNotificationAsRead, onMenuClick, setActiveView }) => {
  const { user, activeChild, setActiveChild, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isProfileMenuOpen, setProfileMenuOpen] = useState(false);
  const [isChildMenuOpen, setChildMenuOpen] = useState(false);

  // ... (restlicher Code bleibt gleich)

  return (
    <header className="flex items-center justify-between h-20 px-6 bg-white border-b-2 border-gray-200 dark:bg-gray-800 dark:border-gray-700">
      {/* ... (vorheriger Code) */}
      
      <div className="flex items-center">
        <button
          onClick={toggleTheme}
          className="p-2 text-gray-500 rounded-full hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300 dark:focus:bg-gray-700"
          aria-label="Toggle dark mode"
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
        
        {/* ... (restlicher Code) */}
      </div>
    </header>
  );
};

export default Header;