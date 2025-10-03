const { Contact } = require("../models/contact.model");


const httpStatus = require("http-status-codes").StatusCodes;

const contactsController = {

    fetchContacts: async (req, res) => {
        try {
            const companyId = req.params.id;

            const data = await Contact.findAll({
                order: [['id', 'DESC']]
            });
            return res.status(httpStatus.OK).json({ message: `Contacts fetched Successfully`, data })
        } catch (error) {
            console.error("Error in fetching contacts: ", error);
            return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: "Prišlo je do napake" });
        }
    },

};

module.exports = contactsController;
