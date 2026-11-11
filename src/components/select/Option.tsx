import { useEffect, useRef } from 'react';
import clsx from 'clsx';
import { OptionType } from 'src/constants/articleProps';
import { Text } from 'components/text';
import { isFontFamilyClass } from './helpers/isFontFamilyClass';
import styles from './Select.module.scss';
type OptionProps = {
	option: OptionType;
	onClick: (value: string) => void;
	id: string;
	active: boolean;
};
export const Option = ({
	option: { value, title, optionClassName, className },
	onClick,
	id,
	active,
}: OptionProps) => {
	const optionRef = useRef<HTMLLIElement>(null);
	useEffect(() => {
		if (active) optionRef.current?.scrollIntoView({ block: 'nearest' });
	}, [active]);
	return (
		<li
			ref={optionRef}
			id={id}
			role='option'
			aria-selected={active}
			className={clsx(styles.option, styles[optionClassName || ''])}
			onMouseDown={(event) => event.preventDefault()}
			onClick={() => onClick(value)}
			onKeyDown={(event) => {
				if (event.key === 'Enter' || event.key === ' ') {
					event.preventDefault();
					onClick(value);
				}
			}}
			data-testid={`select-option-${value}`}>
			<Text family={isFontFamilyClass(className) ? className : undefined}>
				{title}
			</Text>
		</li>
	);
};
