import React, { createContext, useState, useContext, useEffect } from "react";

type ThemeContextType = {
	theme: "light" | "dark";
	toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType>({
	theme: "light",
	toggleTheme: () => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
	const [theme, setTheme] = useState<"light" | "dark">("light");
	const toggleTheme = () => setTheme((prev) => (prev === "light" ? "dark" : "light"));

	useEffect(() => {
		document.body.classList.remove("light", "dark");
		document.body.classList.add(theme);
	}, [theme]);

	return (
		<ThemeContext.Provider value={{ theme, toggleTheme }}>
			{children}
		</ThemeContext.Provider>
	);
};

export const useTheme = () => useContext(ThemeContext);