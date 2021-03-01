import * as React from 'react';
import styled from 'styled-components';

const StyledInput = styled.input`
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
  font-size: 16px;
  font-weight: 300;
  padding: 10px 40px 10px 10px;
  width: 150px;
`;

export interface IInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  isLoading?: boolean;
}

export const Input: React.FC<IInputProps> = (props) => {
  return <StyledInput {...props} />;
};
