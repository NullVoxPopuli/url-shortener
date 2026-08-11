import { ApplicationShell, Navigation, NavigationList, ThemeToggle } from 'nvp.ui';

import HeaderAuthActions from '../application/header-auth-actions';
import HeaderLinks from '../application/header-links';
import { AccountSwitcher } from './account-switcher';
import { SidebarLink } from './sidebar-link';

<template>
  <ApplicationShell>
    <:nav>
      <Navigation>
        {{! @glint-expect-error - route templates do not have typed @model }}
        <AccountSwitcher @accountId={{@model.accountId}} />

        <NavigationList>
          {{! @glint-expect-error - route templates do not have typed @model }}
          <li><SidebarLink @href="/{{@model.accountSlug}}">Dashboard</SidebarLink></li>
        </NavigationList>

        <NavigationList @label="Manage">
          {{! @glint-expect-error - route templates do not have typed @model }}
          <li><SidebarLink @href="/{{@model.accountSlug}}/links">Links</SidebarLink></li>
          {{! @glint-expect-error - route templates do not have typed @model }}
          <li><SidebarLink @href="/{{@model.accountSlug}}/users">Users</SidebarLink></li>
          {{! @glint-expect-error - route templates do not have typed @model }}
          <li><SidebarLink @href="/{{@model.accountSlug}}/domains">Domains</SidebarLink></li>
          {{! @glint-expect-error - route templates do not have typed @model }}
          <li><SidebarLink @href="/{{@model.accountSlug}}/api-keys">API Keys</SidebarLink></li>
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
