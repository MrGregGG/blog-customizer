import { useState, useRef, useId } from 'react';

import clsx from 'clsx';
import { OptionType } from 'src/constants/articleProps';
import { Text } from 'components/text';
import { Spacing } from 'components/spacing';
import arrowDown from 'src/images/arrow-down.svg';
import { Option } from './Option';
import { isFontFamilyClass } from './helpers/isFontFamilyClass';

import { useOutsideClickClose } from './hooks/useOutsideClickClose';

import styles from './Select.module.scss';

type SelectProps = {
	selected: OptionType | null;
	options: OptionType[];
	placeholder?: string;
	onChange?: (selected: OptionType) => void;
	onClose?: () => void;
	title?: string;
};

export const Select = (props: SelectProps) => {
	const { options, placeholder, selected, onChange, onClose, title } = props;
	const [isOpen, setIsOpen] = useState<boolean>(false);
	const rootRef = useRef<HTMLDivElement>(null);
	const placeholderRef = useRef<HTMLButtonElement>(null);
	const listId = useId();
	const [activeIndex, setActiveIndex] = useState(0);
	const available = options.filter(
		(option) => option.value !== selected?.value
	);

	useOutsideClickClose({
		isOpen,
		rootRef,
		onClose,
		onChange: setIsOpen,
	});

	const handleOptionClick = (option: OptionType) => {
		setIsOpen(false);
		onChange?.(option);
		onClose?.();
		placeholderRef.current?.focus();
	};
	const handlePlaceHolderClick = () => {
		setActiveIndex(0);
		setIsOpen((isOpen) => !isOpen);
	};

	return (
		<div>
			{title && (
				<>
					<Text size={12} weight={800} uppercase>
						{title}
					</Text>
					<Spacing size={4} />
				</>
			)}
			<div
				className={styles.selectWrapper}
				ref={rootRef}
				data-is-active={isOpen}
				data-testid='selectWrapper'>
				<img
					src={arrowDown}
					alt='иконка стрелочки'
					className={clsx(styles.arrow, { [styles.arrow_open]: isOpen })}
				/>
				<button
					type='button'
					role='combobox'
					aria-label={title || placeholder}
					aria-haspopup='listbox'
					aria-expanded={isOpen}
					aria-controls={isOpen ? listId : undefined}
					aria-activedescendant={
						isOpen ? `${listId}-${activeIndex}` : undefined
					}
					onKeyDown={(event) => {
						if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
							event.preventDefault();
							setActiveIndex((index) =>
								!isOpen
									? 0
									: (index +
											(event.key === 'ArrowDown' ? 1 : -1) +
											available.length) %
									  available.length
							);
							setIsOpen(true);
						} else if (isOpen && (event.key === 'Enter' || event.key === ' ')) {
							event.preventDefault();
							if (available[activeIndex])
								handleOptionClick(available[activeIndex]);
						} else if (event.key === 'Escape' || event.key === 'Tab') {
							setIsOpen(false);
							if (isOpen) onClose?.();
						} else if (
							isOpen &&
							(event.key === 'Home' || event.key === 'End')
						) {
							event.preventDefault();
							setActiveIndex(event.key === 'Home' ? 0 : available.length - 1);
						}
					}}
					className={clsx(
						styles.placeholder,
						styles[selected?.optionClassName || '']
					)}
					data-selected={!!selected?.value}
					onClick={handlePlaceHolderClick}
					tabIndex={0}
					ref={placeholderRef}>
					<Text
						as='span'
						family={
							isFontFamilyClass(selected?.className)
								? selected?.className
								: undefined
						}>
						{selected?.title || placeholder}
					</Text>
				</button>
				{isOpen && (
					<ul
						id={listId}
						role='listbox'
						aria-label={title || placeholder}
						className={styles.select}
						data-testid='selectDropdown'>
						{available.map((option, index) => (
							<Option
								key={option.value}
								id={`${listId}-${index}`}
								active={index === activeIndex}
								option={option}
								onClick={() => handleOptionClick(option)}
							/>
						))}
					</ul>
				)}
			</div>
		</div>
	);
};
