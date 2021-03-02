import * as React from 'react';
import styled from 'styled-components';

const StyledButton = styled.button`
  background: lightblue;
  color: #fff;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 300;
  padding: 9px 36px;
`;

export interface IButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
}

export const Button: React.FC<IButtonProps> = (props) => {
  return <StyledButton {...props} />;
};
