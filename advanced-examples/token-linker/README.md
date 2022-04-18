# TokenLinker
This example showcases how ERC20 tokens native to a chain can be linked to other chains connected through Axelar. The premise is that a [TokenLinker](TokenLinker.sol) is deployed on each chain, and they only trust other TokenLinkers to tell them when to give tokens to users.

A [SourceTokenLinker](SourceTokenLinker.sol) is deployed on the blockchain where the targeted token naturally exists. This linker will only tell other linkers to give token upon receiving the supported token, and will give back token when other linkers tell it to.

[MirroredTokenLinker](MirroredTokenLinker.sol) are deployed on the other blockchains and mint new tokens when told so by a remote linker. They burn token when instructed to by a user to send it to a different chain.