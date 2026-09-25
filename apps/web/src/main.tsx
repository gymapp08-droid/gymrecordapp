import ReactDOM from 'react-dom/client';
import { GuardedCoachPortalApp } from './screens/CoachPortalApp';

const container = document.getElementById('root');
if (container) {
  const root = ReactDOM.createRoot(container);
  root.render(<GuardedCoachPortalApp />);
}
