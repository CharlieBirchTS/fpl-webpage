import React, { useEffect } from 'react';
import { LiveboardEmbed } from '@thoughtspot/visual-embed-sdk';

const DashboardEmbed = () => {
  useEffect(() => {
    // Embed the ThoughtSpot liveboard using the Embed SDK
    const dashboard = new LiveboardEmbed(document.getElementById('dashboard'), {
        frameParams: {
            width: '100%',
            height: '100%',
        },
        liveboardId: 'f7d29eb4-69ba-4618-ae06-c0eca8bc3583',
    });

    dashboard.render();
  }, []);

  return (
    <div>
      <h2>ThoughtSpot Liveboard</h2>
      <div id="dashboard"></div>
    </div>
  );
};

export default DashboardEmbed;
