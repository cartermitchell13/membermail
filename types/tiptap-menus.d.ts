declare module '@tiptap/react/menus' {
	import * as React from 'react';
	import type { Editor } from '@tiptap/core';
	import type { BubbleMenuPluginProps } from '@tiptap/extension-bubble-menu';

	export type BubbleMenuProps = Partial<Omit<BubbleMenuPluginProps, 'element' | 'pluginKey'>> & React.HTMLAttributes<HTMLDivElement> & {
		pluginKey?: string;
		editor?: Editor | null;
	};

	export const BubbleMenu: React.ForwardRefExoticComponent<BubbleMenuProps & React.RefAttributes<HTMLDivElement>>;
}

