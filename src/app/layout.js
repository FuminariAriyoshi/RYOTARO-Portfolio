
import "./globals.css";
import Cursor from '../components/Cursor';

export const metadata = {
  title: "Abe Portfolio",
  description: "Advanced Portfolio with Three.js",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Cursor />
        {children}
      </body>
    </html>
  );
}
