import React from 'react';
import type { ReactNode } from 'react';
import type { AppCtx } from '../state/context';
import { renderJoinLocked, renderRoomSettings, renderPk, renderCreateRoom, renderQueue, renderLucky } from './RoomPages';
import { renderGameLounge, renderLudoGame, renderUnoGame, renderOtherGame } from './GamePages';
import { renderDm, renderComments, renderNotifications, renderVisitors, renderStrangers } from './ChatPages';
import { renderWallet, renderGifts, renderVip, renderSettings } from './AccountPages';
import { renderFamilies, renderEvents, renderTasks, renderLeaderboard, renderStore } from './CatalogPages';
import { renderEditProfile, renderUserProfile, renderDecorations } from './ProfilePages';

// Picks the full-screen page for the current `page` value (same order as before the split).
export function renderDetail(ctx: AppCtx) {
  const {
    game, page, post, profile, room
  } = ctx;
  let detail: ReactNode = null;
  if (page === 'join-locked') detail = renderJoinLocked(ctx);
  if (page === 'room-settings' && room) detail = renderRoomSettings(ctx);
  if (page === 'games') detail = renderGameLounge(ctx);
  if (page === 'game' && game && game.type === 'ludo') detail = renderLudoGame(ctx);
  if (page === 'game' && game && game.type === 'uno') detail = renderUnoGame(ctx);
  if (page === 'game' && game && game.type !== 'ludo' && game.type !== 'uno') detail = renderOtherGame(ctx);
  if (page === 'pk') detail = renderPk(ctx);
  if (page === 'create-room') detail = renderCreateRoom(ctx);
  if (page === 'dm') detail = renderDm(ctx);
  if (page === 'wallet') detail = renderWallet(ctx);
  if (page === 'gifts') detail = renderGifts(ctx);
  if (page === 'families') detail = renderFamilies(ctx);
  if (page === 'events') detail = renderEvents(ctx);
  if (page === 'tasks') detail = renderTasks(ctx);
  if (page === 'leaderboard') detail = renderLeaderboard(ctx);
  if (page === 'vip') detail = renderVip(ctx);
  if (page === 'store') detail = renderStore(ctx);
  if (page === 'edit-profile') detail = renderEditProfile(ctx);
  if (page === 'user' && profile) detail = renderUserProfile(ctx);
  if (page === 'comments' && post) detail = renderComments(ctx);
  if (page === 'queue' && room) detail = renderQueue(ctx);
  if (page === 'lucky' && room) detail = renderLucky(ctx);
  if (page === 'decorations') detail = renderDecorations(ctx);
  if (page === 'settings') detail = renderSettings(ctx);
  if (page === 'notifications') detail = renderNotifications(ctx);
  if (page === 'visitors') detail = renderVisitors(ctx);
  if (page === 'strangers') detail = renderStrangers(ctx);
  return detail;
}
