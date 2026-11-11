import { useEffect, useRef, useState, FormEvent } from 'react';
import clsx from 'clsx';
import { ArrowButton } from 'components/arrow-button';
import { Button } from 'components/button';
import { Select } from 'components/select';
import { RadioGroup } from 'components/radio-group';
import { Text } from 'components/text';
import { Spacing } from 'components/spacing';
import { Separator } from 'components/separator';
import {
	ArticleStateType,
	OptionType,
	defaultArticleState,
	fontFamilyOptions,
	fontSizeOptions,
	fontColors,
	backgroundColors,
	contentWidthArr,
} from 'src/constants/articleProps';
import styles from './ArticleParamsForm.module.scss';

type ArticleParamsFormProps = { onApply: (settings: ArticleStateType) => void };
export const ArticleParamsForm = ({ onApply }: ArticleParamsFormProps) => {
	const [draftSettings, setDraftSettings] =
		useState<ArticleStateType>(defaultArticleState);
	const [isOpen, setIsOpen] = useState(false);
	const rootRef = useRef<HTMLDivElement>(null);
	useEffect(() => {
		if (!isOpen) return;
		const closeOutside = (event: MouseEvent) => {
			if (
				event.target instanceof Node &&
				!rootRef.current?.contains(event.target)
			)
				setIsOpen(false);
		};
		document.addEventListener('mousedown', closeOutside);
		return () => document.removeEventListener('mousedown', closeOutside);
	}, [isOpen]);
	const change = (key: keyof ArticleStateType) => (value: OptionType) =>
		setDraftSettings((previous) => ({ ...previous, [key]: value }));
	const apply = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		onApply(draftSettings);
		setIsOpen(false);
		rootRef.current?.querySelector('button')?.focus();
	};
	const reset = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setDraftSettings(defaultArticleState);
		onApply(defaultArticleState);
	};
	return (
		<div ref={rootRef}>
			<ArrowButton
				isOpen={isOpen}
				onClick={() => setIsOpen((previous) => !previous)}
				controls='article-params'
			/>
			<aside
				id='article-params'
				aria-label='Параметры статьи'
				aria-hidden={!isOpen}
				className={clsx(styles.container, { [styles.container_open]: isOpen })}>
				{isOpen && (
					<form className={styles.form} onSubmit={apply} onReset={reset}>
						<Text as='h2' size={31} weight={800} uppercase>
							Задайте параметры
						</Text>
						<Spacing size={50} />
						<Select
							title='Шрифт'
							options={fontFamilyOptions}
							selected={draftSettings.fontFamilyOption}
							onChange={change('fontFamilyOption')}
						/>
						<Spacing size={50} />
						<RadioGroup
							title='Размер шрифта'
							name='font-size'
							options={fontSizeOptions}
							selected={draftSettings.fontSizeOption}
							onChange={change('fontSizeOption')}
						/>
						<Spacing size={50} />
						<Select
							title='Цвет шрифта'
							options={fontColors}
							selected={draftSettings.fontColor}
							onChange={change('fontColor')}
						/>
						<Spacing size={30} />
						<Separator />
						<Spacing size={30} />
						<Select
							title='Цвет фона'
							options={backgroundColors}
							selected={draftSettings.backgroundColor}
							onChange={change('backgroundColor')}
						/>
						<Spacing size={30} />
						<Select
							title='Ширина контента'
							options={contentWidthArr}
							selected={draftSettings.contentWidth}
							onChange={change('contentWidth')}
						/>
						<Spacing size={50} />
						<div className={styles.bottomContainer}>
							<Button title='Сбросить' type='reset' />
							<Button title='Применить' type='submit' />
						</div>
					</form>
				)}
			</aside>
		</div>
	);
};
