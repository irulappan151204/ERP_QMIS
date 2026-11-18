import { CircleAlert } from 'lucide-react'
import Dialog from './Dialog'
import Button from './Button'

const ConfirmAction = ({
    open,
    onClose,
    onConfirm,
    title,
    description,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    tone = 'primary',
    busy = false,
    confirmDisabled = false,
    children,
}) => (
    <Dialog
        open={open}
        onClose={onClose}
        title={title}
        description={description}
        size='sm'
        closeOnBackdrop={!busy}
        closeOnEscape={!busy}
        footer={(
            <>
                <Button
                    variant='secondary'
                    onClick={() => onClose?.('cancel')}
                    disabled={busy}
                >
                    {cancelLabel}
                </Button>
                <Button
                    variant={tone === 'danger' ? 'danger' : 'primary'}
                    onClick={onConfirm}
                    disabled={busy || confirmDisabled}
                    loading={busy}
                    loadingText='Working…'
                >
                    {confirmLabel}
                </Button>
            </>
        )}
    >
        <div className='flex items-start gap-3'>
            <span className='inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-[#FFF3E8] text-[var(--erp-amber)]'>
                <CircleAlert aria-hidden='true' size={20} />
            </span>
            <div className='min-w-0 text-sm text-[var(--erp-slate)]'>{children}</div>
        </div>
    </Dialog>
)

export default ConfirmAction
