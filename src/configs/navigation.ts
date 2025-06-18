import menuAi from './menus/ai.menu';
import menuUI from './menus/ui.menu';
import menuPages from './menus/pages.menu';
import menuLanding from './menus/landing.menu';
// import menuUML from './menus/uml.menu';
// import menuData from './menus/data.menu';
// import menuApps from './menus/apps.menu';
// import menuCharts from './menus/charts.menu';

export default {
  menu: [
    {
      text: '',
      key: '',
      items: [
        {
          key: 'menu.dashboard',
          text: 'Dashboard',
          link: '/dashboard',
          icon: 'mdi-view-dashboard-outline',
        },
      ],
    },
    {
      text: 'chatgpt',
      items: menuAi,
    },
    {
      text: 'Landing',
      items: menuLanding,
    },
    {
      text: 'UI - Theme Preview',
      items: menuUI,
    },
    {
      text: 'Pages',
      key: 'menu.pages',
      items: menuPages,
    },
    // {
    //   text: 'Apps',
    //   items: menuApps,
    // },
    // {
    //   text: 'Data',
    //   items: menuData,
    // },
    // {
    //   text: 'Charts',
    //   key: 'menu.charts',
    //   items: menuCharts,
    // },
    // {
    //   text: 'UML',
    //   // key: "menu.uml",
    //   items: menuUML,
    // },
  ],
};
