//tests
import { describe, it } from 'mocha';
import { expect } from 'chai';
//modules
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

function Counter() {
  const [count, setCount] = React.useState(0);
  return (
    <div>
      <div>Count: {count}</div>
      <button type="button" onClick={() => setCount((c) => c + 1)}>
        Increment
      </button>
    </div>
  );
}

describe('react/testing-library', () => {
  it('renders a component and handles user interaction', async () => {
    const user = userEvent.setup();

    render(<Counter />);

    expect(screen.getByText('Count: 0')).to.exist;

    await user.click(screen.getByRole('button', { name: 'Increment' }));

    expect(screen.getByText('Count: 1')).to.exist;
  });
});
