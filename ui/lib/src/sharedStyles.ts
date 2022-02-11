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

  .section {
    border: 1px solid black;
    border-radius: 5px;
    padding: 10px;
  }
  .section-name {
    margin-bottom: 0px;
  }
`;
