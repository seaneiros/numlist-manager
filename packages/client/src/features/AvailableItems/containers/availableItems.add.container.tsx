import { useState }              from 'react';
import {
  App,
  Button,
  Form,
  Input }                        from 'antd';
import { AvailableItemsService } from '../../../di';
import { asNumber }              from '../../../utils';


type AddItemFormValues = { value: string };

export const AvailableItemsAddContainer = () => {
  const [ form ] = Form.useForm<AddItemFormValues>();
  const { message } = App.useApp();
  const [ submitting, setSubmitting ] = useState(false);

  const submit = async ({ value }: AddItemFormValues) => {
    const [ add ] = AvailableItemsService.addAvailableItem(Number(value));

    setSubmitting(true);

    try {
      await add();
      form.resetFields();
      message.success(`Item ${value} is queued and will appear shortly on scroll or page reload`);
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Failed to add the item');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form form={form} layout="inline" onFinish={submit}>
      <Form.Item<AddItemFormValues>
        name="value"
        style={{ flex: 1 }}
        normalize={asNumber}
        rules={[
          { required: true, message: 'Value is required' },
          { validator: validateValue },
        ]}
      >
        <Input
          inputMode="numeric"
          placeholder="Add New Value"
          aria-label="Add New Value"
          disabled={submitting}
        />
      </Form.Item>
      <Form.Item style={{ marginInlineEnd: 0 }}>
        <Button type="primary" htmlType="submit" loading={submitting}>
          Submit
        </Button>
      </Form.Item>
    </Form>
  );
};


/* HELPERS */

const validateValue = (_: unknown, raw: string | undefined): Promise<void> => {
  if (!raw) {
    return Promise.resolve();
  }

  const value = Number(raw);
  const minValue = 1_000_001;
  const maxValue = Number.MAX_SAFE_INTEGER;

  if (Number.isSafeInteger(value) && value >= minValue) {
    return Promise.resolve();
  }

  return Promise.reject(new Error(`ID must be from ${minValue} to ${maxValue}`));
}
