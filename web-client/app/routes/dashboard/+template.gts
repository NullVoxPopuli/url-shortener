import { ApplicationShell, Navigation, NavigationList, ThemeToggle } from 'nvp.ui';

import HeaderAuthActions from '../application/header-auth-actions';
import HeaderLinks from '../application/header-links';
import { SidebarLink } from './sidebar-link';

<template>
  <ApplicationShell>
    <:nav>
      <Navigation>
        <NavigationList @label="nvp.gg">
          <li><SidebarLink @href="/dashboard">Dashboard</SidebarLink></li>
        </NavigationList>

        <NavigationList @label="Manage">
          <li><SidebarLink @href="/dashboard/links">Links</SidebarLink></li>
          <li><SidebarLink @href="/dashboard/users">Users</SidebarLink></li>
          <li><SidebarLink @href="/dashboard/domains">Domains</SidebarLink></li>
        </NavigationList>
      </Navigation>
    </:nav>

    <:headerLeft>
      <a href="/">Home</a>
      <span aria-hidden="true">|</span>
      <HeaderLinks @hideAppLinks={{true}} />
    </:headerLeft>

    <:headerRight>
      <HeaderAuthActions />
      <ThemeToggle />
    </:headerRight>

    <:default>
      {{outlet}}
    </:default>
  </ApplicationShell>
</template>
