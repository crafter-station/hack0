import * as React from "react";

export function useMediaQuery(query: string): boolean {
	const [matches, setMatches] = React.useState(false);

	React.useEffect(() => {
		const mql = window.matchMedia(query);
		const onChange = () => setMatches(mql.matches);

		// Set initial value
		setMatches(mql.matches);

		mql.addEventListener("change", onChange);
		return () => mql.removeEventListener("change", onChange);
	}, [query]);

	return matches;
}
