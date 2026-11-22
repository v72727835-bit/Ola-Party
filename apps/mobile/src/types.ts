import React from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export type Item = Record<string, any>;
export type Icon = React.ComponentProps<typeof Ionicons>['name'];
export type MIcon = React.ComponentProps<typeof MaterialCommunityIcons>['name'];
