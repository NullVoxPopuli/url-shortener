import { ApplicationShell, Navigation, NavigationList, ThemeToggle } from 'nvp.ui';

import HeaderAuthActions from '../application/header-auth-actions';
import HeaderLinks from '../application/header-links';

<template>
  <ApplicationShell>
    <:nav>
      <Navigation>
        <NavigationList @label="nvp.gg">
          <li><a href="/">Home</a></li>
          <li><a href="/dashboard" aria-current="page">Dashboard</a></li>
        </NavigationList>
      </Navigation>
    </:nav>

    <:headerLeft>
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
