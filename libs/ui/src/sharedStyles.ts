import { css } from 'lit';

export const sharedStyles = css`
  .column {
    display: flex;
    flex-direction: column;
  }
  .row {
    display: flex;
    flex-direction: row;
  }
  .agent {
    background-color: lightsteelblue;
    margin-right: 5px;
    padding: 0 2px 0 2px;
    border-radius: 0.2em;
  }
  .info-item {
    font-size: 1.1em;
    font-weight: bold;
  }
  .info-item-name {
    font-size: .9em;
    color: #999;
    font-weight: normal;  
  }
  .hilight {
    background-color: yellow;
  }
  .deleted {
    text-decoration: line-through;
  }
  .source {
    overflow-x: auto;
    white-space: pre-wrap;
    white-space: -pre-wrap;
    word-wrap: break-word;
  }
`;