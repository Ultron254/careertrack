import { DesktopShell } from './DesktopShell';
import { MobileShell } from './MobileShell';
import { useIsDesktop } from './useMediaQuery';

// One codebase, two information architectures. The 900px switch is a hook, not
// a user agent sniff, so it responds to resizing and to device rotation.
export function ShellLayout() {
  const isDesktop = useIsDesktop();
  return isDesktop ? <DesktopShell /> : <MobileShell />;
}
