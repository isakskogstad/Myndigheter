import { render, screen } from '@testing-library/react';
import App from './App';

beforeAll(() => {
  window.matchMedia = window.matchMedia || function() {
    return {
      matches: false,
      addListener: function() {},
      removeListener: function() {}
    };
  };
});

test('renders app without crashing', () => {
  render(<App />);
  const loadingElement = screen.getByText(/Laddar applikationen.../i);
  expect(loadingElement).toBeTruthy();
});
