import { keyframes, styled } from 'styled-components'
import { StyledBox } from '../MyVeCakeCard'

const shineAnimation = keyframes`
	0% {transform:translateX(-100%);}
  7% {transform:translateX(100%);}
	100% {transform:translateX(100%);}
`

export const ShineStyledBox = styled(StyledBox)`
  position: relative;
  overflow: hidden;
  &::after {
    content: '';
    top: 0;
    transform: translateX(100%);
    width: 100%;
    height: 100%;
    position: absolute;
    z-index: 1;
    animation: ${shineAnimation} 15s infinite 2s;
    background: -webkit-linear-gradient(
      left,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.8) 50%,
      rgba(128, 186, 232, 0) 99%,
      rgba(125, 185, 232, 0) 100%
    );
  }
`
