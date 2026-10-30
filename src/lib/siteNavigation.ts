/** Shared destinations for the visible navigation and its command animation. */
export const primaryNavigation = [
  { path: "/projects/", label: "Work", key: "1" },
  { path: "/experience/", label: "Experience", key: "2" },
  { path: "/about/", label: "About", key: "3" },
  { path: "/brief/", label: "Brief", key: "4" },
] as const;

export const animatedNavigation = [{ path: "/", label: "Home" }, ...primaryNavigation] as const;

/** Treat each public page as a directory in the site's navigation hierarchy. */
export function getNavigationCommand(currentPath: string, destination: string): string {
  const current = currentPath.split("/").filter(Boolean);
  const target = destination.split("/").filter(Boolean);
  if (!target.length) return "cd ~";
  let shared = 0;
  while (shared < current.length && shared < target.length && current[shared] === target[shared]) shared++;
  const stepsUp = current.length - shared;
  if (stepsUp >= 2) return `cd ~/${target.join("/")}`;
  const relative = [...Array<string>(stepsUp).fill(".."), ...target.slice(shared)].join("/");
  return `cd ${relative || "."}`;
}
