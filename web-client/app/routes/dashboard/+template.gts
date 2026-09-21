import { ApplicationShell, Navigation, NavigationList, ThemeToggle } from 'nvp.ui';

import HeaderAuthActions from '../application/header-auth-actions.gts';
import HeaderLinks from '../application/header-links.gts';
import { AccountSwitcher } from './account-switcher.gts';
import { SidebarLink } from './sidebar-link.gts';

import type { TOC } from '@ember/component/template-only';

<template>
  <ApplicationShell>
    <:nav>
      <Navigation>
        <AccountSwitcher @accountId={{@model.accountId}} />

        <NavigationList>
          <li><SidebarLink @href="/{{@model.accountSlug}}">Dashboard</SidebarLink></li>
        </NavigationList>

        <NavigationList @label="Manage">
          <li><SidebarLink @href="/{{@model.accountSlug}}/links">Links</SidebarLink></li>
          <li><SidebarLink @href="/{{@model.accountSlug}}/users">Users</SidebarLink></li>
          <li><SidebarLink @href="/{{@model.accountSlug}}/domains">Domains</SidebarLink></li>
          <li><SidebarLink @href="/{{@model.accountSlug}}/api-keys">API Keys</SidebarLink></li>
        </NavigationList>

        <NavigationList @label="Settings">
          <li><SidebarLink @href="/{{@model.accountSlug}}/settings/billing">Billing</SidebarLink></li>
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
</template> satisfies TOC<{
  Args: {
    model: {
      accountId: string;
      accountSlug: string;
      accountName: string;
      isAdmin: boolean;
    };
  };
}>;
