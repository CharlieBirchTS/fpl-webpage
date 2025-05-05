import React, { useEffect } from 'react';
import { ConversationEmbed } from '@thoughtspot/visual-embed-sdk';

const AgenticEmbed = () => {
  useEffect(() => {
    // Embed the ThoughtSpot liveboard using the Embed SDK
    const agent = new ConversationEmbed(document.getElementById('agent'), {
        frameParams: {
            width: '100%',
            height: '100%',
        },
        worksheetId: '80ffe6ed-45d5-42a5-9975-113f538becbf',
    });

    agent.render();
  }, []);

  return (
    <div>
      <h2>FPL Agent</h2>
      <div id="agent"></div>
    </div>
  );
};

export default AgenticEmbed;
