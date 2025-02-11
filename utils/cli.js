import meow from 'meow';

const flags = {
	clear: {
		type: `boolean`,
		default: false,
		shortFlag: `c`,
		desc: `Clear the console`
	},
	debug: {
		type: `boolean`,
		default: false,
		shortFlag: `d`,
		desc: `Print debug info`
	},
	event:{
		type: `string`,
		default: "",
		desc: "For obtaining info about events"
	},
	checkStarred:{
		type:`string`,
		default: "",
		desc: "Obtaining starred repositories"
	},
	profile:{
		type:`string`,
		default:"",
		desc:"profile info"
	},
	pull:{
		type:`string`,
		default:"",
		desc:"Pull requests"
	},
	issues:{
		type:`string`,
		default:"",
		desc:"Issues"
	}

};

// const commands = {
// 	help: { desc: `Print help info` }
// };

// const helpText = meowHelp({
// 	name: `calai`,
// 	flags,
// 	commands
// });

const options = {
	importMeta: import.meta,
	inferType: true,
	description: false,
	hardRejection: false,
	flags
};

export default meow( options);
