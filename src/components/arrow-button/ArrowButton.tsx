import clsx from 'clsx';
import arrow from 'src/images/arrow.svg';
import styles from './ArrowButton.module.scss';

export type OnClick = () => void;
type ArrowButtonProps = {
	isOpen: boolean;
	onClick: OnClick;
	controls?: string;
};
export const ArrowButton = ({
	isOpen,
	onClick,
	controls,
}: ArrowButtonProps) => (
	<button
		type='button'
		onClick={onClick}
		aria-label={isOpen ? 'Закрыть настройки' : 'Открыть настройки'}
		aria-expanded={isOpen}
		aria-controls={controls}
		className={clsx(styles.container, { [styles.container_open]: isOpen })}>
		<img
			src={arrow}
			alt=''
			className={clsx(styles.arrow, { [styles.arrow_open]: isOpen })}
		/>
	</button>
);
