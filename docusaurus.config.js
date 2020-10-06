module.exports = {
  title: 'intermix',
  tagline: 'A Framework for Web Based Audio Apps',
  url: 'https://rolandjansen.github.io',
  baseUrl: '/intermix/',
  favicon: 'img/favicon.ico',
  organizationName: 'RolandJansen', // Usually your GitHub org/user name.
  projectName: 'intermix', // Usually your repo name.
  onBrokenLinks: 'warn', // this can probably be removed in future versions
  themeConfig: {
    colorMode: {
      defaultMode: 'dark',
    },
    navbar: {
      title: 'intermix',
      // logo: {
      //   alt: 'My Site Logo',
      //   src: 'img/logo.svg',
      // },
      items: [
        {
          to: 'docs/',
          activeBasePath: 'docs',
          label: 'Docs',
          position: 'left',
        },
        {to: 'blog', label: 'Blog', position: 'left'},
        {
          href: 'https://github.com/RolandJansen/intermix',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'API Functions',
              to: 'docs/',
            },
            {
              label: 'API Messages',
              to: 'docs/API_messages',
            },
            {
              label: 'Changelog',
              to: 'docs/CHANGELOG/',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'Bugtracker',
              href: 'https://github.com/RolandJansen/intermix/issues',
            },
            // {
            //   label: 'Stack Overflow',
            //   href: 'https://stackoverflow.com/questions/tagged/docusaurus',
            // },
            // {
            //   label: 'Discord',
            //   href: 'https://discordapp.com/invite/docusaurus',
            // },
            // {
            //   label: 'Twitter',
            //   href: 'https://twitter.com/docusaurus',
            // },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'Blog',
              to: 'blog',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/RolandJansen/intermix',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Roland Jansen. Built with Docusaurus.`,
    },
  },
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          // It is recommended to set document id as docs home page (`docs/` path).
          homePageId: 'API_messages',
          sidebarPath: require.resolve('./sidebars.js'),
          // Please change this to your repo.
          editUrl:
            'https://github.com/RolandJansen/intermix/tree/homepage',
        },
        blog: {
          showReadingTime: true,
          // Please change this to your repo.
          editUrl: 'https://github.com/RolandJansen/intermix/tree/homepage/blog',
          feedOptions: {
            type: 'all',
            language: "en",
            title: 'Intermix Blog',
            copyright: `Copyright © ${new Date().getFullYear()} Roland Jansen.`,
          },
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],
};
