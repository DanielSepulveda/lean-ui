import React from 'react';
import renderer from 'react-test-renderer';
import 'jest-styled-components';

import { Input } from '../src';

describe('Input', () => {
  test('renders correctly', () => {
    const tree = renderer
      .create(<Input placeholder="user@gmail.com" />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
});
