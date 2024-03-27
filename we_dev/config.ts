import { defineConfig } from '@lightningrodlabs/we-dev-cli';

export default defineConfig({
  groups: [
    {
      name: 'Lightning Rod Labs',
      networkSeed: '098rc1m-09384u-crm-29384u-cmkj',
      icon: {
        type: 'filesystem',
        path: './we_dev/lrl-icon.png',
      },
      creatingAgent: {
        agentIdx: 1,
        agentProfile: {
          nickname: 'Zippy',
          avatar: {
            type: 'filesystem',
            path: './we_dev/zippy.jpg',
          },
        },
      },
      joiningAgents: [
        {
          agentIdx: 2,
          agentProfile: {
            nickname: 'Zerbina',
            avatar: {
              type: 'filesystem',
              path: './we_dev/zerbina.jpg',
            },
          },
        },
      ],
      applets: [
        {
          name: 'how Hot Reload',
          instanceName: 'how Hot Reload',
          registeringAgent: 1,
          joiningAgents: [2],
        },
        {
          name: 'gamez',
          instanceName: 'gamez',
          registeringAgent: 1,
          joiningAgents: [2],
        },
        {
          name: 'notebooks',
          instanceName: 'notebooks',
          registeringAgent: 1,
          joiningAgents: [2],
        },
      ],
    },
  ],
  applets: [
    {
      name: 'how Hot Reload',
      subtitle: 'how!',
      description: 'how indeed!',
      icon: {
        type: 'filesystem',
        path: './we_dev/how_icon.png',
      },
      source: {
        type: 'localhost',
        happPath: './workdir/how.happ',
        uiPort: 8888,
      },
    },
    {
        name: 'gamez',
        subtitle: 'play!',
        description: 'Real-time games based on syn',
        icon: {
          type: "https",
          url: "https://raw.githubusercontent.com/holochain-apps/gamez/main/we_dev/gamez_icon.svg"
        },
        source: {
          type: "https",
          url: "https://github.com/holochain-apps/gamez/releases/download/v0.4.1/gamez.webhapp"
        },
      },
      {
      name: 'notebooks',
      subtitle: 'Collaborative note taking',
      description: 'Real-time note-taking based on syn',
      icon: {
        type: 'https',
        url: 'https://lightningrodlabs.org/projects/notebooks_logo.svg',
      },
      source: {
        type: 'https',
        url: 'https://github.com/lightningrodlabs/notebooks/releases/download/v0.2.4/notebooks.webhapp',
      },
    },
  ],
});