/** @odoo-module */


// Author   => Albertus Restiyanto Pramayudha
// email    => xabre0010@gmail.com
// linkedin => https://www.linkedin.com/in/albertus-restiyanto-pramayudha-470261a8/
// youtube  => https://www.youtube.com/channel/UCCtgLDIfqehJ1R8cohMeTXA

import { patch, unpatch } from "@web/core/utils/patch";
import { Record } from "@web/views/basic_relational_model";
import { evalDomain } from "@web/views/utils";
import { FormController } from "@web/views/form/form_controller";


patch(Record.prototype, 'yudha_web_monetary_not_zero', {
    async checkValidity(urgent) {
        if (!urgent) {
            await this.askChanges();
        }
        for (const fieldName in this.activeFields) {
            const fieldType = this.fields[fieldName].type;
            const activeField = this.activeFields[fieldName];
            if (fieldName in this._requiredFields) {
                if (
                    !evalDomain(this._requiredFields[fieldName], this.evalContext) ||
                    (activeField && activeField.alwaysInvisible)
                ) {
                    this._removeInvalidFields([fieldName]);
                    continue;
                }
            }

            const isSet =
                activeField && activeField.FieldComponent && activeField.FieldComponent.isSet;

            if (this.isRequired(fieldName) && isSet && !isSet(this.data[fieldName])) {
                this.setInvalidField(fieldName);
                continue;
            }

            switch (fieldType) {
                case "boolean":
                case "float":
                case "integer":
                case "html":
                    if (this.isRequired(fieldName) && this.data[fieldName].length === 0) {
                        this._setInvalidField(fieldName);
                    }
                    break;
                case "properties":
                    if (!this.checkPropertiesValidity(fieldName)) {
                        this._setInvalidField(fieldName);
                    }
                    break;
                case "one2many":
                case "many2many":
                    if (!(await this.checkX2ManyValidity(fieldName, urgent))) {
                        this._setInvalidField(fieldName);
                    }
                    break;
                default:
                    if (!isSet && this.isRequired(fieldName) && !this.data[fieldName]) {
                        this._setInvalidField(fieldName);
                    }
            }
        }
        return !this._invalidFields.size;
    },
});

patch(FormController.prototype, 'pest_one2many_formcontroller', {
    async saveButtonClicked(params = {}) {
        const record = this.model.root;
        if (await record.checkValidity()) {
            this.disableButtons();
            const record = this.model.root;
            let saved = false;
            if (this.props.saveRecord) {
                saved = await this.props.saveRecord(record, params);
            } else {
                saved = await record.save();
            }
            this.enableButtons();
            if (saved && this.props.onSave) {
                this.props.onSave(record, params);
            }
            return saved;
        } else {
            record.openInvalidFieldsNotification();
            return false;
        }
    },
});